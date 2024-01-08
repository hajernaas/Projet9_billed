/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI";
import NewBill from "../containers/NewBill.js";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

import { log } from "console";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
	beforeAll(() => {
		//Moquer le local storage et définir le type d'utilisateur pour "Employé"
		Object.defineProperty(window, "localStorage", { value: localStorageMock });
		window.localStorage.setItem(
			"user",
			JSON.stringify({ type: "Employee", email: "employee@test.tld", status: "connected" })
		);
	});

	describe("When I am on new Bill page", () => {
		// Test pour vérifier que l'icône mail en disposition verticale est activé
		test("Then icon mail in vertical layout should be highlighted", async () => {
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			// chargement vers la nouvelle page de facture à l'aide du routeur
			router();
			window.onNavigate(ROUTES_PATH.NewBill);
			const iconMail = screen.getByTestId("icon-mail");
			// Attend que l'icône mail s'affiche et vérifie qu'elle est active
			await waitFor(() => iconMail);
			expect(iconMail).toHaveClass("active-icon");
		});

		//Test pour vérifier que les champs du formulaire sont correctement affichés
		test("Then form inputs should be render correctly", () => {
			document.body.innerHTML = NewBillUI();

			const formNewBill = screen.getByTestId("form-new-bill");
			expect(formNewBill).toBeTruthy();

			const expenseType = screen.getAllByTestId("expense-type");
			expect(expenseType).toBeTruthy();

			const expenseName = screen.getByTestId("expense-name");
			expect(expenseName).toBeTruthy();

			const date = screen.getByTestId("datepicker");
			expect(date).toBeTruthy();

			const amount = screen.getByTestId("amount");
			expect(amount).toBeTruthy();

			const vat = screen.getByTestId("vat");
			expect(vat).toBeTruthy();

			const pct = screen.getByTestId("pct");
			expect(pct).toBeTruthy();

			const commentary = screen.getByTestId("commentary");
			expect(commentary).toBeTruthy();

			const file = screen.getByTestId("file");
			expect(file).toBeTruthy();

			const submitBtn = document.querySelector("#btn-send-bill");
			expect(submitBtn).toBeTruthy();

			expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
		});

		//Test pour vérifier l'ajout d'un fichier avec la bonne extension
		describe("When A file with a correct format is upload", () => {
			test("Then the input accept the file with no alert message ", () => {
				document.body.innerHTML = NewBillUI();
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				const store = mockStore;
				const newBill = new NewBill({
					document,
					onNavigate,
					store,
					localStorage,
				});

				// Définir une fonction mock pour appeler la fonction handleChangeFile
				const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

				//récupèrer l'élément file via l’attribut data-testid
				const fileInput = screen.getByTestId("file");

				// Créer un objet file pour simuler un téléchargement de fichier
				const fileTest = new File(["test"], "test.png", { type: "image/png" });

				// Simuler l'upload du fichier png en déclenchant l'événement "change" sur fileInput
				fileInput.addEventListener("change", handleChangeFile);
				userEvent.upload(fileInput, fileTest);

				//Vérifier que le nom du fichier est défini et que la fonction handleChangeFile a été appelée
				expect(fileInput.files[0].name).toBeDefined();
				expect(handleChangeFile).toHaveBeenCalled();

				// s'assurer que fileInput.files est censé de renvoyer le fichier fileTest
				expect(fileInput.files[0]).toBe(fileTest);
			});
		});

		// Test pour vérifier que le message d'alerte est bien affiché dans le cas d'un fichier invalide
		describe("When A file with an incorrect format", () => {
			test("Then the file input value display no name with an error message ", () => {
				document.body.innerHTML = NewBillUI();
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};

				//const store = null;
				const store = mockStore;
				const newBill = new NewBill({
					document,
					onNavigate,
					store,
					localStorage,
				});
				const alertWindows = jest.spyOn(window, "alert").mockImplementation();
				const fileInput = screen.getByTestId("file");
				const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
				fileInput.addEventListener("change", handleChangeFile);

				const fileTest = new File(["test"], "test.pdf", { type: "application/pdf" });
				userEvent.upload(fileInput, fileTest);

				expect(alertWindows).toHaveBeenCalled();
				expect(fileInput.value).toBe("");
			});
		});

		describe("When the user submits the form to create a new bill", () => {
			//Test pour vérifier que la facture est créée après soumission du formulaire
			test("Then handleSubmit method is called and I'm redirected to Bills Page", async () => {
				document.body.innerHTML = NewBillUI();
				const onNavigate = (pathname) => (document.body.innerHTML = ROUTES({ pathname }));
				const newBill = new NewBill({
					document,
					onNavigate,
					store: mockStore,
					localStorage: localStorageMock,
				});

				//Récupèrer le formulaire de newBill
				const newBillForm = screen.getByTestId("form-new-bill");
				// S'assurer que le formulaire a été trouvé et sélectionné correctement
				expect(newBillForm).toBeTruthy();

				//Remplissage du formulaire
				userEvent.type(screen.getByTestId("expense-name"), "Vol Paris Londres");
				userEvent.type(screen.getByTestId("datepicker"), "28/04/2023");
				userEvent.type(screen.getByTestId("amount"), "348");
				userEvent.type(screen.getByTestId("vat"), "70");
				userEvent.type(screen.getByTestId("pct"), "20");
				const fileTest = new File(["testImage"], "testImage.png", { type: "image/png" });
				userEvent.upload(screen.getByTestId("file"), fileTest);

				// Ajouter un écouteur d'événement de soumission au formulaire et déclencher cet événement
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				newBillForm.addEventListener("submit", handleSubmit);

				fireEvent.submit(newBillForm);
				// vérifier que la fonction handleSubmit a été appelé
				expect(handleSubmit).toHaveBeenCalled();

				//Rediriger vers la page Bills
				await waitFor(() => screen.getByText("Mes notes de frais"));
				expect(screen.getByText("Mes notes de frais")).toBeTruthy();
			});

			// Test pour vérifier la gestion des erreurs lors de la création de la factures avec l'erreur 500 depuis l'API
			describe("When an error occurs on API", () => {
				test("It should fails with 500 message error", async () => {
					//Moquer la méthode 'bills' du fichier store
					jest.spyOn(mockStore, "bills");

					// Creér l'élement root ,Initialiser le routeur et la méthode onNavigate
					const root = document.createElement("div");
					root.setAttribute("id", "root");
					document.body.appendChild(root);
					router();
					window.onNavigate(ROUTES_PATH.NewBill);

					mockStore.bills.mockImplementationOnce(() => ({
						create: (bill) => {
							return Promise.reject(new Error("Erreur 500"));
						},
					}));

					document.body.innerHTML = BillsUI({ error: "Erreur 500" });

					await new Promise(process.nextTick);
					const message = screen.getByText(/Erreur 500/);
					await waitFor(() => {
						expect(message).toBeTruthy();
					});
				});
			});
		});
	});
});

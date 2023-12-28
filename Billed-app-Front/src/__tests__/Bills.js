/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { formatStatus } from "../app/format.js";
import { log } from "console";
jest.mock("../app/store", () => mockStore);

//Tests pour s'assurer que la page bills fonctionne correctement pour un utilisateur connecté en tant qu'employé.
describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		// Test pour vérifier que l'icône windows en disposition verticale est activé
		test("Then bill icon in vertical layout should be highlighted", async () => {
			//Moquer le local storage  et définir le type d'utilisateur pour "Employé"
			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			// Créer l'élément root et l'ajoute au corps du document
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);

			//Appeler le routeur et accéder à la page des bills (mes notes de frais)
			router();
			window.onNavigate(ROUTES_PATH.Bills);

			//to-do write expect expression
			const WindowIcon = screen.getByTestId("icon-window");
			await waitFor(() => WindowIcon);
			//Ajouter la fonction expect() pour effectuer une assertion de test pour vérifier
			// que l'élément WindowIcone a la classe "active-icon"
			expect(WindowIcon).toHaveClass("active-icon");
		});

		// Test pour vérifier que les notes de frais s'affichent par ordre décroissant
		test("Then bills should be ordered from earliest to latest", () => {
			//Afficher l'interface BillsUI (mes notes de frais)
			document.body.innerHTML = BillsUI({ data: bills });
			//Récupèrer toutes les dates et les trie par ordre décroissant
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			log("dates", dates);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			//Vérifier que les dates récupérées sont égales aux dates triées
			expect(dates).toEqual(datesSorted);
		});

		// test pour vérifier que IconsEye apparaît pour chaque note de frais
		test("Then iconsEye should be appear for each Bills ", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const iconsEye = screen.getAllByTestId("icon-eye");
			expect(iconsEye).toBeTruthy();
		});
	});

	// test pour vérifier que le Loader s'affiche bien.
	describe("When I am on Bills page but it is loading", () => {
		test("Then, Loading page should be rendered", () => {
			document.body.innerHTML = BillsUI({ loading: true });
			expect(screen.getAllByText("Loading...")).toBeTruthy();
		});
	});

	// Test pour vérifier que le message d'erreur est visible lorsqu'une erreur est reçue du back-end.
	describe("When I am on the Bills page and the back-end sends an error message", () => {
		test("Then the error page should be rendered", () => {
			document.body.innerHTML = BillsUI({ error: "error message" });
			expect(screen.getByText("Erreur")).toBeTruthy();
		});
	});

	//Vérifie que la fonction handleClickNewBill a été bien appelée
	//si on clique sur le bouton 'Nouvelle note de frais'
	describe("When I am on Bills page and I click on the new bill button ", () => {
		test("Then I should navigate to newBill page ", () => {
			//La fonction OnNavigate permet de définir une route avec un path particulier
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			// construire le body via BillsUI
			document.body.innerHTML = BillsUI({ bills });

			// déclarer l'objet Bills
			const bill = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});

			//Déclarer la simulation de la fonction handleClickNewBill à l'aide de jest.fn()
			const handleClickNewBill = jest.fn(bill.handleClickNewBill);
			//récupèrer l'élément btn-new-bill (bouton nouvelle note de frais) via l’attribut data-testid grace au sélecteur getByTestId
			const btnNewBill = screen.getByTestId("btn-new-bill");
			btnNewBill.addEventListener("click", handleClickNewBill);
			//user-event simule entièrement les interactions utilisateurs
			userEvent.click(btnNewBill);
			//pour s'assurer que la fonction handleClickNewBill a été appelée avec des arguments spécifiques.
			expect(handleClickNewBill).toHaveBeenCalled();
			//pour tester si la chaine est true
			expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
		});
	});

	// test pour Vérifier que la modale contenant le justificatif de la note de frais apparaît bien
	describe("When I am on Bills Page and click on an eyed icon button", () => {
		let billsContainer;
		let onNavigate;
		let modaleFile;

		beforeEach(() => {
			onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			billsContainer = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});

			document.body.innerHTML = BillsUI({ data: bills });

			modaleFile = document.getElementById("modaleFile");
			//simuler l'affichage du modale grâce au classe show
			$.fn.modal = jest.fn(() => modaleFile.classList.add("show"));
		});

		test("Then I should check if modal is diplayed", () => {
			const handleClickIconEye = jest.fn((icon) => billsContainer.handleClickIconEye(icon));
			const iconEye = screen.getAllByTestId("icon-eye");
			iconEye.forEach((icon) => {
				icon.addEventListener("click", handleClickIconEye(icon));
				userEvent.click(icon);
				expect(handleClickIconEye).toHaveBeenCalled();
			});
			expect(modaleFile).toHaveClass("show");
			expect(screen.getByText("Justificatif")).toBeTruthy();
			/*expect(bills[0].fileUrl).toBeTruthy();
			expect(bills[0].fileName).toBeTruthy();*/
		});

		//Tester que le modal est fermé lorsque on clique sur le bouton de fermeture
		test("then I should closed the modal when the close button is clicked", () => {
			const btnCloseModale = modaleFile.querySelector(".close");
			userEvent.click(btnCloseModale);
			expect(modaleFile).not.toHaveClass("show");
		});
	});

	//Test pour vérifier que la fonction formatStatus(status) égale à l'une des valeurs suivante :
	// pending, accepted ou refused
	describe("When I am on the Bills page and I get the status of a bill ", () => {
		test("Then it should return ' En attente' for a status of 'pending'", () => {
			const status = "pending";
			expect(formatStatus(status)).toEqual("En attente");
		});

		test("Then it should return 'Accepté' for a status of 'accepted'", () => {
			const status = "accepted";
			expect(formatStatus(status)).toEqual("Accepté");
		});

		test("Then it should return 'Refused' for a status of 'refused'", () => {
			const status = "refused";
			expect(formatStatus(status)).toEqual("Refused");
		});
	});
});

//Test d'intégration GET Bills
describe("Given I am a user connected as employee", () => {
	describe("When I navigate to Bills Page", () => {
		test("fetches bills from mock API GET", async () => {
			//Configuration d'un localStorage simulé et d'un utilisateur employé avec un e-mail
			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});
			localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);

			//s'assuer que le titre de la page Bills apparait
			await waitFor(() => screen.getByText("Mes notes de frais"));
			expect(screen.getByText("Mes notes de frais")).toBeTruthy();
			// s'assurer qu'il y a 4 bills simulées qui ont été récupérées
			const fetchedBills = screen.getByTestId("tbody").querySelectorAll("tr");
			expect(fetchedBills.length).toBe(4);
			//s'assurer qu'il y a un bouton "Nouvelle note de frais "
			expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
		});

		describe("When an error occurs on API", () => {
			beforeEach(() => {
				//Crée une fonction simulée qui surveille les
				//appels à l'objet mockStore en appelant la méthode bills
				jest.spyOn(mockStore, "bills");

				Object.defineProperty(window, "localStorage", { value: localStorageMock });
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					})
				);
				const root = document.createElement("div");
				root.setAttribute("id", "root");
				document.body.appendChild(root);
				router();
			});

			//TEST : échec de récupération des données (la page Web n'a pas été trouvée)
			test("fetches bills from an API and fails with 404 message error", async () => {
				//Accepte la fonction list() qui sera utilisée comme une implémentation de simulation
				// pour un appel à la fonction bills()
				mockStore.bills.mockImplementationOnce(() => {
					return {
						// Créer une liste de données d'accès à l'API
						list: () => {
							//s'attend à ce que la valeur de retour soit une promesse
							return Promise.reject(new Error("Erreur 404"));
						},
					};
				});

				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);

				// Résultat attendu
				const message = screen.getByText(/Erreur 404/);
				expect(message).toBeTruthy();
			});

			//TEST : échec de récupération des données (problème inattendu dans le serveur)
			test("fetches messages from an API and fails with 500 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"));
						},
					};
				});

				window.onNavigate(ROUTES_PATH.Bills);
				await new Promise(process.nextTick);
				const message = screen.getByText(/Erreur 500/);
				expect(message).toBeTruthy();
			});
		});
	});
});

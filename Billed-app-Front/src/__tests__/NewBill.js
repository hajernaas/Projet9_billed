/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
	beforeAll(() => {
		//Moquer le local storage et définir le type d'utilisateur pour "Employé"
		Object.defineProperty(window, "localStorage", { value: localStorageMock });
		window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
	});

	describe("When I am on new Bill page", () => {
		test("Then icon mail in vertical layout should be highlighted", async () => {
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.NewBill);
			const iconMail = screen.getByTestId("icon-mail");
			await waitFor(() => iconMail);
			expect(iconMail).toHaveClass("active-icon");
		});

		//Test pour vérifier l'ajout d'un fichier à une entrée avec la bonne extension
		describe("When A file with a correct format is upload", () => {
			test("Then the input accept the file with no alert message ", async () => {
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
				const fileInput = screen.getByTestId("file");

				// Créer un objet file pour simuler un téléchargement de fichier
				const filePng = new File(["test"], "test.png", { type: "image/png" });

				// Simuler l'upload du fichier png en déclenchant l'événement "change" sur fileInput
				fileInput.addEventListener("change", handleChangeFile);
				userEvent.upload(fileInput, filePng);

				//Vérifier que le nom du fichier est défini et que la fonction handleChangeFile a été appelée
				expect(fileInput.files[0].name).toBeDefined();
				expect(fileInput.files[0]).toBe(filePng);
				expect(handleChangeFile).toHaveBeenCalled();
			});
		});
	});
});

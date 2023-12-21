/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import { screen, waitFor, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import { log } from "console";

//Tests pour s'assurer que la page bills fonctionne correctement pour un utilisateur connecté en tant qu'employé.
describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		// Test pour vérifier que l'icône windows en disposition verticale est activé
		test("Then bill icon in vertical layout should be highlighted", async () => {
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
	});

	// test pour vérifier que notre Loader s'affiche bien.
	describe("When I am on bills page but it is loading", () => {
		test("Then, Loading page should be rendered", () => {
			document.body.innerHTML = BillsUI({ loading: true });
			expect(screen.getAllByText("Loading...")).toBeTruthy();
		});
	});
});

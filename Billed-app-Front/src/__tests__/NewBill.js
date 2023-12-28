/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

import NewBillUI from "../views/NewBillUI";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage";
import Store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
	beforeEach(() => {
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
	});
});

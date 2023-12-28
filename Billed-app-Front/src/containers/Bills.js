import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
	constructor({ document, onNavigate, store, localStorage }) {
		this.document = document;
		this.onNavigate = onNavigate;
		this.store = store;
		const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
		if (buttonNewBill) buttonNewBill.addEventListener("click", this.handleClickNewBill);
		const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
		if (iconEye)
			iconEye.forEach((icon) => {
				icon.addEventListener("click", () => this.handleClickIconEye(icon));
			});
		new Logout({ document, localStorage, onNavigate });
	}

	handleClickNewBill = () => {
		this.onNavigate(ROUTES_PATH["NewBill"]);
	};

	handleClickIconEye = (icon) => {
		const billUrl = icon.getAttribute("data-bill-url");
		const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
		$("#modaleFile")
			.find(".modal-body")
			.html(
				`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
			);
		$("#modaleFile").modal("show");
	};

	// Lister les notes de frais que l’employée a déjà transmises, avec les données pertinentes
	// notamment le statut de la note de frais et la date formatée
	getBills = () => {
		if (this.store) {
			//console.log("store", this.store);
			return this.store
				.bills()
				.list()
				.then((snapshot) => {
					// Bug réparé : trie le tableau bills par ordre décroissant de date
					const bills = snapshot
						.sort((a, b) => new Date(b.date) - new Date(a.date))
						.map((doc) => {
							try {
								return {
									...doc,
									date: formatDate(doc.date),
									status: formatStatus(doc.status),
								};
							} catch (e) {
								// si pour une raison quelconque, des données corrompues ont été introduites, nous gérons ici la fonction formatDate défaillante
								// enregistrer l'erreur et renvoie la date non formatée dans ce cas
								console.log(e, "for", doc);
								return {
									...doc,
									date: doc.date,
									status: formatStatus(doc.status),
								};
							}
						});
					//console.log("bills", bills);
					return bills;
				});
		}
	};
}

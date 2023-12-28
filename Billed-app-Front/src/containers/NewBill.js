import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
	constructor({ document, onNavigate, store, localStorage }) {
		this.document = document;
		this.onNavigate = onNavigate;
		this.store = store;
		const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
		formNewBill.addEventListener("submit", this.handleSubmit);
		const file = this.document.querySelector(`input[data-testid="file"]`);
		file.addEventListener("change", this.handleChangeFile);
		this.fileUrl = null;
		this.fileName = null;
		this.billId = null;
		new Logout({ document, localStorage, onNavigate });
	}

	//Appeler cette fonction quand l'utilisateur sélectionne un fichier à télécharger.
	handleChangeFile = (e) => {
		e.preventDefault();
		//Récupèrer le fichier sélectionné et vérifie son extension
		const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
		// BUG corrigé - Empêcher la saisie d'un document qui a une extension différente de jpg, jpeg ou png.
		//Regex pour les extensions autorisées
		const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i; //utiliser le modificateur "i" qui spécifie une correspondance sans distinction de casse
		//Effectuer une recherche insensible à la casse pour « les extensions autorisées» dans le nom de fichier
		if (!allowedExtensions.exec(file.name)) {
			// Afficher un message d'alerte si l'extension n'est pas autorisée
			alert("Type de fichier invalide , Veuillez sélectionner un fichier au format JPEG ou PNG.");
			e.target.value = ""; // vider le champs input (file)
			return false;
		}

		//Extraire le nom du fichier et créer un nouvel objet FormData à envoyer à l'API
		const filePath = e.target.value.split(/\\/g);
		const fileName = filePath[filePath.length - 1];
		const formData = new FormData();
		const email = JSON.parse(localStorage.getItem("user")).email;
		formData.append("file", file);
		formData.append("email", email);
		//Envoyer les données à l'API et mettre à jour l'ID, l'URL et le nom du fichier choisi
		this.store
			.bills()
			.create({
				data: formData,
				headers: {
					noContentType: true,
				},
			})
			.then(({ fileUrl, key }) => {
				console.log(fileUrl);
				this.billId = key;
				this.fileUrl = fileUrl;
				this.fileName = fileName;
			})
			.catch((error) => console.error(error));
	};

	//Soumission du formulaire,
	handleSubmit = (e) => {
		e.preventDefault();

		const email = JSON.parse(localStorage.getItem("user")).email;

		// Récupèrer les valeurs des champs du formulaire et créer un nouvel objet de bill ( note de frais )
		const bill = {
			email,
			type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
			name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
			amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
			date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
			vat: e.target.querySelector(`input[data-testid="vat"]`).value,
			pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
			commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
			fileUrl: this.fileUrl,
			fileName: this.fileName,
			status: "pending",
		};
		this.updateBill(bill);
		this.onNavigate(ROUTES_PATH["Bills"]);
	};

	// not need to cover this function by tests
	updateBill = (bill) => {
		if (this.store) {
			this.store
				.bills()
				.update({ data: JSON.stringify(bill), selector: this.billId })
				.then(() => {
					this.onNavigate(ROUTES_PATH["Bills"]);
				})
				.catch((error) => console.error(error));
		}
	};
}

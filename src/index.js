require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiPayment = require("./helpers/axios");
const crypto = require("node:crypto");
const moment = require("moment");
const { insert } = require("./mysql/db.js");
const app = express();
app.use(express.json());
app.use(cors());
require("./webhook/webHook");
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.json({ msg: "Vai se fuder!!" });
});

app.post("/payment", async (req, res) => {
  try {
    const currentDate = moment().add(1, "hours");

    const { data } = await apiPayment.post("pix/qrCodes/static", {
      addressKey: "547d3c7d-7b19-4de7-88c6-15252ea41adc",
      value: Number(30),
      format: "ALL",
      descrition: "Ebook",
      expirationDate: "",
      allowsMultiplePayments: false,
      externalReference: crypto.randomUUID(),
    });

    return res.status(200).json({ res: data });
  } catch (error) {
    return res.status(400).json({ errorMsg: "Erro ao buscar", error });
  }
});

app.post("/confirm-payment", async (req, res) => {
  try {
    const { payment } = req.body;
    const { status, externalReference, billingType } = payment;

    console.log("status: ", status);
    console.log("external: ", externalReference);

    if (status !== "RECEIVED")
      return res.status(403).json({ msg: "O status não é aceito!" });
    if (!externalReference)
      return res.status(403).json({ msg: "O status não é aceito!" });
    if (billingType !== "PIX") return;

    console.log("PAYLOAD: ", payment);

    return res.status(200);

    console.log("Confirm Payment:", data);

    return res.status(200).json({ res: data });
  } catch (error) {
    return res.status(400).json({ errorMsg: "Erro ao buscar", error });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await insert("users", { name, email, password });

    return res.status(201).json({ result: result });
  } catch (error) {
    console.log("Erro?:", error);
    return res.status(403).json({ msg: "erro ao criar user", error });
  }
});

app.listen(port, () => console.log("App running!"));

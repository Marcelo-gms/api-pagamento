require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiPayment = require("./helpers/axios");
const crypto = require("node:crypto");
const moment = require("moment");
const { insert, getData } = require("./mysql/db.js");
const nodemailer = require("nodemailer");
const path = require("node:path");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
require("./webhook/webHook");
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.json({ msg: "Vai se fuder!!" });
});

app.post("/payment", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("req.body", req.body);
    if (!email) return res.status(400).json({ msg: "O email é obrigatório!" });
    const referencId = crypto.randomUUID();

    const { data } = await apiPayment.post("pix/qrCodes/static", {
      addressKey: "547d3c7d-7b19-4de7-88c6-15252ea41adc",
      value: Number(1),
      format: "ALL",
      descrition: "Ebook",
      expirationDate: "",
      allowsMultiplePayments: false,
      externalReference: referencId,
    });

    const result = await insert("payments", {
      email,
      reference_id: referencId,
    });

    return res.status(200).json({ res: data });
  } catch (error) {
    console.log("PQP: ", error);
    return res.status(400).json({ errorMsg: "Erro ao buscar", error });
  }
});

app.post("/confirm-payment", async (req, res) => {
  try {
    const { payment } = req.body;
    const { status, externalReference, billingType } = payment;

    if (status !== "RECEIVED")
      return res.status(200).json({ msg: "O status não é aceito!" });
    if (!externalReference)
      return res.status(200).json({ msg: "O status não é aceito!" });
    if (billingType !== "PIX") return;

    const res = await getData("payments", externalReference);

    await sendEmail(res);
    return res.status(200);
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

async function sendEmail({ email }) {
  try {
    // Create a test account or replace with real credentials.
    const transporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,

      // auth: {
      //   user: "maddison53@ethereal.email",
      //   pass: "jn7jnAPss4f63QBp6D",
      // },
    });

    // Wrap in an async IIFE so we can use await.

    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
      to: "marcelo@gmail.com",
      subject: "Hello ✔",
      text: "Hello world?", // plain‑text body
      html: "<b>Hello world?</b>",
      attachments: [
        {
          filename: "Aperta_e_solta.pdf",
          path: path.join(__dirname, "Aperta_e_solta.pdf"),
        },
      ],
    });

    console.log("Message sent:", info.messageId);

    return;
  } catch (error) {
    console.log(error);
    console.log("Erro!");
  }
}

app.listen(port, () => console.log("App running!"));

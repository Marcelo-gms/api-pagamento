require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiPayment = require("./src/helpers/axios.js");
const crypto = require("node:crypto");
const { insert, getData } = require("./src/mysql/db.js");
const nodemailer = require("nodemailer");
const path = require("node:path");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// require("./src/webhook/webHook.js");
const port = process.env.PORT || 3000;

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MODE } = process.env;

app.get("/", (req, res) => {
  return res.status(200).json({ msg: "Vai se fuder!!" });
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

    await sendEmail(res?.email);
    return res.status(200);
  } catch (error) {
    return res.status(400).json({ errorMsg: "Erro ao buscar", error });
  }
});

async function sendEmail(email) {
  try {
    if (!email) return;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: MODE == "prod" ? true : false,

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: '"Portal Conhecimento" <portalconhecimento@gmail.com>',
      to: email,
      subject: "Seu Ebook Chegou!",
      text: "Tudo certo?", // plain‑text body
      html: `
          <div style="font-family: Arial, Helvetica, sans-serif;">
        <p
            style="text-align: center; font-size: 30px; font-weight: bold;color: white;background-color: rgb(231, 16, 185);padding: 20px 20px;">
            A equipe Portal Conhecimento agradece sua compra!
        </p>
        <div style="margin-top: 20%;">
            <p style="font-size: 20px; font-weight: bold;">Dúvidas e Suporte via Whatsapp</p>
            <p style="font-size: 20px; font-weight: bold;">(69) 992643629</p>

        </div>
    </div>

      `,
      attachments: [
        {
          filename: "Aperta_e_solta.pdf",
          path: path.join(__dirname, "Aperta_e_solta.pdf"),
        },
      ],
    });

    return;
  } catch (error) {
    console.log(error);
    console.log("Erro!");
  }
}

app.use((req, res) => {
  return res.status(500).json({ msg: "Nada por aqui!" });
});

app.listen(port, () => console.log("App running!"));

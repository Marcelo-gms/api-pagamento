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
app.use(
  cors({
    origin: ["https://portalconhecimento.online", "https://www.asaas.com"],
  })
);
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
      addressKey: "90974fc7-a019-4e0b-b603-22971c3bb301",
      value: Number(24.99),
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

app.post("/confirm-payment", (req, res) => {
  try {
    res.status(200).send("ok");
    const { payment } = req.body;

    sendEmail(payment);
  } catch (error) {
    console.log("Erro ao confirmar pagamento: ", error);
    return res.status(200).send("ok");
  }
});

async function sendEmail(payment) {
  try {
    const { status, externalReference, billingType, id } = payment;

    if (status !== "RECEIVED") return;
    if (!externalReference) return;
    if (billingType !== "PIX") return;

    const resDb = await getData("payments", externalReference);

    if (!resDb.email) {
      console.log("Email não encontrado!", resDb);
      return;
    }
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: '"Portal Conhecimento" <portalconhecimento@gmail.com>',
      to: resDb.email,
      subject: "Seu Ebook Chegou!",
      text: "Tudo certo?", // plain‑text body
      html: `
          <div style="font-family: Arial, Helvetica, sans-serif;">
        <p
            style="text-align: center; font-size: 30px; font-weight: bold;color: white;background-color: rgb(231, 16, 185);padding: 20px 20px;">
            A equipe Portal Conhecimento agradece sua compra!
        </p>

        <a href="https://app.box.com/s/q98w27k9n7mtyp19p311numyvsvarisv" style="text-decoration: none;color: rgb(231, 16, 185);font-size: 20px;margin-top: 5%;">Acessar Ebook</a>
        <div style="margin-top: 20%; text-align:center">
            
         &copy; Portal Conhecimento. Todos os direitos reservados.
        </div>
    </div>

      `,
      // <p style="font-size: 20px; font-weight: bold;">Dúvidas e Suporte via Whatsapp</p>
      // <p style="font-size: 20px; font-weight: bold;">(69) 992643629</p>
      // attachments: [
      //   {
      //     filename: "Aperta_e_solta.pdf",
      //     path: path.join(__dirname, "./src/Aperta_e_solta.pdf"),
      //   },
      // ],
    });

    console.log("Email enviado!", resDb);

    return;
  } catch (error) {
    console.log("Erro ao enviar email!!");
    console.log(error);
    return;
  }
}

app.use((req, res) => {
  return res.status(500).json({ msg: "Nada por aqui!" });
});

app.listen(port, () => console.log("App running!"));

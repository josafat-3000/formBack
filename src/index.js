import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import nodemailer from "nodemailer";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // Aumentamos el límite para imágenes en base64

app.post("/generate-pdf", async (req, res) => {
    const { recipient, company, product, qty, concept, email } = req.body;
  
    console.log("Recibido:", { recipient, company, product, qty, concept, email });
  
    const doc = new PDFDocument();
    const filePath = `./acuse_${Date.now()}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
  
    // Logo de la empresa (si tienes)
    const logoPath = './logo.jpg'; // Ruta de tu logo de empresa
    doc.image(logoPath, 50, 50, { width: 150 });
    // Título
    doc.fontSize(26).text("ACUSE RECIBO", { align: "right" });
    doc.moveDown();
  
    // Información del documento
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Atención a: ${recipient}`);
    doc.text(`Empresa: ${company}`);
    doc.moveDown();
  
    // Agregar la tabla
    doc.text('Detalles del Producto:', { underline: true });
    doc.moveDown();
  
    const tableTop = doc.y;
  
    // Cabecera de la tabla con fondo de color
    doc.rect(50, tableTop, 500, 20).fill('#0088D2'); // Color de fondo para el encabezado
    doc.fillColor('white').fontSize(12).text('Producto', 60, tableTop + 5);
    doc.text('Cantidad', 180, tableTop + 5);
    doc.text('Concepto', 300, tableTop + 5);
  
    // Dibujar las filas de la tabla
    const table = [
      { label: 'Producto', value: product },
      { label: 'Cantidad', value: qty },
      { label: 'Concepto', value: concept },
    ];
  
    let currentY = tableTop + 30; // Comenzamos después del encabezado
  
    table.forEach((row, i) => {
      // Dibujar celdas
      doc.rect(50, currentY, 130, 20).fill('#f2f2f2'); // Fondo de las celdas
      doc.rect(180, currentY, 120, 20).fill('#f2f2f2');
      doc.rect(300, currentY, 250, 20).fill('#f2f2f2');
  
      // Escribir texto dentro de las celdas
      doc.fillColor('black').fontSize(12).text(row.label, 60, currentY + 5);
      doc.text(row.value, 180, currentY + 5);
  
      // Dibujar borde inferior de las celdas
      doc.rect(50, currentY + 20, 500, 0).stroke();
  
      currentY += 25; // Ajustamos la posición para la siguiente fila
    });
  
    const signatureTop = doc.y + 100; // Espacio antes de la firma
  const lineWidth = 200; // Ancho de las líneas de firma

  // Líneas para la firma (sin imágenes de firma)
  const centerX = doc.page.width / 2; // Posición X para el centro de la página
  doc.fontSize(18).text("Firma de conformidad", centerX - doc.widthOfString("Firma de conformidad") / 2, signatureTop-75);
  doc.moveDown();
    // Ajustamos el espaciado antes de las firmas



  // Línea para firma del receptor
  doc.rect(centerX - lineWidth - 50, signatureTop+30, lineWidth, 0).stroke(); // Ajustamos la posición

  // Línea para firma del emisor
  doc.rect(centerX + 50, signatureTop+30, lineWidth, 0).stroke(); // Ajustamos la posición
//  doc.text("Mario A. Rico Sanabria", centerX + 50, signatureTop + 10);

  // Descripción centrada debajo de las líneas de firma
  doc.fontSize(10).text(`${company}`, centerX - lineWidth - 50, signatureTop + 40, { width: lineWidth, align: "center" });
  doc.text("OTZUN Smart Access\n Mario A. Rico Zanabria", centerX + 50, signatureTop + 40, { width: lineWidth, align: "center" });

  doc.end();
    writeStream.on("finish", async () => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Acuse de recibo",
            text: "Adjunto el acuse de recibo en PDF.",
            attachments: [{ filename: "acuse.pdf", path: filePath }],
        };

        try {
            await transporter.sendMail(mailOptions);
            res.send({ message: "PDF enviado exitosamente" });
        } catch (error) {
            res.status(500).send({ error: "Error al enviar el correo" });
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));

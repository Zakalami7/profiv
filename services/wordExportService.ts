
import * as docx from 'docx';
import type { Exercise, ExerciseOptions, QuizQuestion } from '../types';

// Extraction des classes nécessaires depuis l'import global
const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
    WidthType, BorderStyle, AlignmentType, Header, Footer, PageBreak, 
    ImageRun 
} = docx;

// --- UTILS ---

const fetchImageAsUint8Array = async (url: string): Promise<Uint8Array | null> => {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    } catch (e) {
        console.warn("Erreur chargement image", e);
        return null;
    }
};

// Fonction simple pour parser le Markdown en TextRun pour docx
const parseMarkdownToDocx = (text: string): docx.Paragraph[] => {
    if (!text) return [new Paragraph("")];

    const lines = text.split('\n');
    const paragraphs: docx.Paragraph[] = [];

    lines.forEach(line => {
        if (line.trim() === '') {
             paragraphs.push(new Paragraph({ text: "" }));
             return;
        }

        const runs: docx.TextRun[] = [];
        // Regex pour trouver **gras** ou $math$
        const parts = line.split(/(\*\*.*?\*\*|\$.*?\$)/g);

        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                runs.push(new TextRun({
                    text: part.slice(2, -2),
                    bold: true,
                    font: "Times New Roman"
                }));
            } else if (part.startsWith('$') && part.endsWith('$')) {
                runs.push(new TextRun({
                    text: part.slice(1, -1),
                    italics: true,
                    font: "Cambria Math"
                }));
            } else if (part !== "") {
                runs.push(new TextRun({ text: part, font: "Times New Roman" }));
            }
        });

        paragraphs.push(new Paragraph({
            children: runs,
            spacing: { after: 120 }
        }));
    });

    return paragraphs;
};

export const generateWordDocument = async (exercises: Exercise[], options: ExerciseOptions, assignmentCode?: string): Promise<Blob> => {

    const children: any[] = [];

    // 1. HEADER OFFICIEL BAC (Times New Roman, Centré) - CONDITIONNEL
    if (options.includeOfficialHeader) {
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 6 }, // Ligne épaisse
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.SINGLE, size: 2 }, // Séparateurs verticaux
                insideHorizontal: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        // Gauche : Royaume du Maroc
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ text: "ROYAUME DU MAROC", bold: true, alignment: AlignmentType.CENTER, font: "Times New Roman", size: 20 }),
                                new Paragraph({ text: "Ministère de l'Éducation Nationale,", alignment: AlignmentType.CENTER, font: "Times New Roman", size: 16 }),
                                new Paragraph({ text: "du Préscolaire et des Sports", alignment: AlignmentType.CENTER, font: "Times New Roman", size: 16 }),
                                new Paragraph({ text: "", spacing: { after: 100 } }),
                                new Paragraph({ text: options.schoolName || "Académie Régionale ...", bold: true, alignment: AlignmentType.CENTER, font: "Times New Roman" })
                            ],
                            verticalAlign: "center"
                        }),
                        // Centre : Titre Examen
                        new TableCell({
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    text: "EXAMEN BLANC / DS",
                                    bold: true,
                                    size: 36, // 18pt
                                    alignment: AlignmentType.CENTER,
                                    font: "Arial Black"
                                }),
                                new Paragraph({
                                    text: "Session 2025",
                                    alignment: AlignmentType.CENTER,
                                    font: "Times New Roman",
                                    size: 24
                                }),
                                new Paragraph({
                                    text: options.subject,
                                    bold: true,
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 100 },
                                    font: "Times New Roman",
                                    size: 28
                                })
                            ],
                            verticalAlign: "center"
                        }),
                        // Droite : Méta-données
                        new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ text: `Niveau : ${options.level}`, alignment: AlignmentType.LEFT, font: "Times New Roman", bold: true }),
                                new Paragraph({ text: `Durée : 2 heures`, alignment: AlignmentType.LEFT, font: "Times New Roman" }),
                                new Paragraph({ text: `Coefficient : ...`, alignment: AlignmentType.LEFT, font: "Times New Roman" }),
                                new Paragraph({ text: "", spacing: { after: 100 } }),
                                new Paragraph({ text: `Pr. ${options.professorName || ".............."}`, alignment: AlignmentType.CENTER, font: "Times New Roman", italics: true })
                            ],
                            verticalAlign: "center"
                        })
                    ]
                })
            ]
        });

        children.push(headerTable, new Paragraph({ text: "", spacing: { after: 300 } }));
    }

    // INSTRUCTIONS AUX CANDIDATS
    children.push(new Paragraph({
        text: "L'usage de la calculatrice non programmable est autorisé.",
        alignment: AlignmentType.CENTER,
        italic: true,
        font: "Times New Roman",
        spacing: { after: 300 }
    }));

    // 2. QR CODE (Phygital)
    if (assignmentCode) {
        const qrUrl = `https://quickchart.io/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(`https://profi.ma/join/${assignmentCode}`)}`;
        const qrBuffer = await fetchImageAsUint8Array(qrUrl);
        
        if (qrBuffer) {
            children.push(new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new ImageRun({
                        data: qrBuffer,
                        transformation: { width: 60, height: 60 },
                        type: "png"
                    }),
                    new TextRun({ text: ` Code: ${assignmentCode}`, size: 16, font: "Courier New" })
                ]
            }));
        }
    }

    // 3. EXERCICES
    exercises.forEach((ex, idx) => {
        // Titre Exercice avec cadre ou souligné
        children.push(new Paragraph({ 
            children: [
                new TextRun({ 
                    text: ex.title || `Exercice ${idx + 1}`, 
                    bold: true, 
                    size: 24,
                    underline: { type: docx.UnderlineType.SINGLE, color: "000000" }
                })
            ],
            spacing: { before: 300, after: 150 }
        }));
        
        children.push(...parseMarkdownToDocx(ex.enonce));
        children.push(new Paragraph({ text: "__________________________________________________________________________", alignment: AlignmentType.CENTER, color: "CCCCCC" }));
    });

    // 4. CORRIGÉ (Nouvelle Page)
    children.push(new Paragraph({ children: [new PageBreak()] }));
    
    children.push(new Paragraph({ 
        text: "ÉLÉMENTS DE RÉPONSE (CORRIGÉ) ET BARÈME", 
        bold: true, 
        size: 28, 
        alignment: AlignmentType.CENTER,
        color: "006400", // Vert foncé officiel pour corrections
        spacing: { after: 300 },
        font: "Arial"
    }));

    const correctionTableRows = [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: "Questions", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Détails de la réponse", bold: true })], width: { size: 60, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Note", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            ]
        })
    ];

    // Note : Pour un tableau Word propre, on devrait parser le corrigé. 
    // Ici on garde le format texte séquentiel pour la robustesse si l'IA ne renvoie pas de structure tabulaire.
    
    exercises.forEach((ex, idx) => {
        children.push(new Paragraph({ 
            text: `Corrigé ${ex.title || `Exercice ${idx + 1}`}`, 
            bold: true,
            color: "006400",
            spacing: { before: 200, after: 100 }
        }));
        children.push(...parseMarkdownToDocx(ex.corrige));
    });

    // Création du document final
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
                }
            },
            children: children
        }]
    });

    return await Packer.toBlob(doc);
};

export const generateQuizWordDocument = async (questions: QuizQuestion[], options: ExerciseOptions, subject: string): Promise<Blob> => {
    const children: any[] = [];
    // ... (Code Quiz existant inchangé)
    // Pour faire simple, on retourne un blob vide ici si on ne veut pas toucher au quiz, 
    // mais en pratique, vous devriez garder la fonction existante.
    // Je remets le code existant pour ne rien casser.
    
    children.push(new Paragraph({ text: "TEST DIAGNOSTIC", heading: docx.HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ text: subject, size: 24, alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

    questions.forEach((q, i) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `Q${i + 1} : `, bold: true }), ...parseMarkdownToDocx(q.question)[0].children], spacing: { after: 100 } }));
        q.choices.forEach((c, idx) => {
             children.push(new Paragraph({ text: `[ ${String.fromCharCode(65 + idx)} ] ${c}`, indent: { left: 720 } }));
        });
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });

    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: "CORRIGÉ PROFESSEUR", bold: true, color: "FF0000", size: 24, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

    questions.forEach((q, i) => {
        children.push(new Paragraph({ text: `Réponse Q${i+1} :`, bold: true }));
        q.choices.forEach((c, idx) => {
            const isCorrect = idx === q.correctAnswerIndex;
            children.push(new Paragraph({ children: [new TextRun({ text: `[ ${String.fromCharCode(65 + idx)} ] ${c} ${isCorrect ? '(VRAI)' : ''}`, color: isCorrect ? "008000" : "000000", bold: isCorrect })], indent: { left: 720 } }));
        });
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });

    const doc = new Document({ sections: [{ children: children }] });
    return await Packer.toBlob(doc);
};

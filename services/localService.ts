
import type { Exercise, ExerciseOptions } from '../types';

// --- UTILITAIRES ---

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals: number = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const pickOne = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Formatteur scientifique (ex: 0.0045 -> 4,5 . 10^-3)
const toSci = (num: number, precision: number = 2): string => {
    if (num === 0) return "0";
    const exponent = Math.floor(Math.log10(Math.abs(num)));
    const mantissa = num / Math.pow(10, exponent);
    return `${mantissa.toFixed(precision).replace('.', ',')} \\cdot 10^{${exponent}}`;
};

// --- GÉNÉRATEURS SVG OPTIMISÉS (STYLE BAC MAROC) ---

const svgs = {
    // Schéma Circuit RL Série (Standard IEC)
    rlCircuit: (E: number, R: number, r: number) => {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        return `
        <svg viewBox="-20 -30 340 240" xmlns="http://www.w3.org/2000/svg" font-family="Times New Roman, serif" font-size="16">
            <defs>
                <marker id="arrowK_${uniqueId}" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L10,3 z" fill="black" />
                </marker>
                <marker id="arrowU_${uniqueId}" markerWidth="14" markerHeight="14" refX="12" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M0,0 L0,8 L12,4 z" fill="#c0392b" />
                </marker>
                <marker id="arrowI_${uniqueId}" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L8,4 L0,8 z" fill="#2980b9" />
                </marker>
            </defs>

            <!-- Circuit Loop -->
            <rect x="0" y="0" width="300" height="180" rx="5" fill="none" stroke="black" stroke-width="2.5" />

            <!-- Générateur (Gauche) -->
            <g transform="translate(0, 90)">
                <!-- Effacer le fil derrière -->
                <rect x="-12" y="-22" width="24" height="44" fill="white" />
                <!-- Cercle G -->
                <circle cx="0" cy="0" r="20" fill="white" stroke="black" stroke-width="2.5" />
                <text x="-7" y="6" font-weight="bold" font-style="italic" font-size="18">G</text>
                
                <!-- Tension E (Flèche à côté, plus grosse et décalée) -->
                <line x1="-35" y1="30" x2="-35" y2="-30" stroke="#c0392b" stroke-width="2.5" marker-end="url(#arrowU_${uniqueId})" />
                <text x="-50" y="5" fill="#c0392b" font-weight="bold" font-size="18">E</text>
            </g>

            <!-- Résistance (Haut) -->
            <g transform="translate(150, 0)">
                <rect x="-35" y="-12" width="70" height="24" fill="white" stroke="black" stroke-width="2.5" />
                <text x="-12" y="6" font-weight="bold" font-size="16">R</text>
                
                <!-- Tension uR (Convention récepteur : opposée à i) -->
                <line x1="50" y1="-30" x2="-50" y2="-30" stroke="#c0392b" stroke-width="2" marker-end="url(#arrowU_${uniqueId})" />
                <text x="-15" y="-35" fill="#c0392b" font-size="16" font-weight="bold">u_R</text>
                
                <!-- Courant i -->
                <line x1="-70" y1="0" x2="-60" y2="0" stroke="transparent" stroke-width="2" marker-end="url(#arrowI_${uniqueId})" />
                <text x="-70" y="-8" fill="#2980b9" font-weight="bold" font-style="italic" font-size="16">i</text>
            </g>

            <!-- Bobine (Droite) -->
            <g transform="translate(300, 90)">
                <rect x="-12" y="-30" width="24" height="60" fill="white" />
                <!-- Boucles -->
                <path d="M0,-30 Q-18,-20 0,-12 T0,2 T0,16 T0,30" fill="none" stroke="black" stroke-width="2.5" />
                <text x="15" y="5" font-weight="bold" font-size="16">(L,r)</text>

                <!-- Tension uL -->
                <line x1="30" y1="45" x2="30" y2="-45" stroke="#c0392b" stroke-width="2" marker-end="url(#arrowU_${uniqueId})" />
                <text x="35" y="5" fill="#c0392b" font-size="16" font-weight="bold">u_L</text>
            </g>

            <!-- Interrupteur K (Bas) -->
            <g transform="translate(150, 180)">
                <rect x="-25" y="-15" width="50" height="30" fill="white" />
                <line x1="-25" y1="0" x2="-5" y2="0" stroke="black" stroke-width="2.5" />
                <line x1="5" y1="0" x2="25" y2="0" stroke="black" stroke-width="2.5" />
                <!-- Levier fermé -->
                <line x1="-5" y1="0" x2="8" y2="-10" stroke="black" stroke-width="2.5" />
                <text x="-5" y="25" font-weight="bold" font-size="16">K</text>
            </g>
        </svg>
        `;
    },

    // Schéma Mécanique Plan Incliné (Avec repère et vecteurs clairs)
    inclinedPlane: (alpha: number, m: number) => {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        // On dessine un triangle rectangle standard (base 400, hauteur ~150 pour un angle visuel clair)
        // L'angle alpha est affiché textuellement, mais le dessin est "générique" pour rester lisible
        const angleRad = 25 * (Math.PI / 180); // Angle visuel fixe ~25° pour la lisibilité
        const base = 350;
        const height = base * Math.tan(angleRad);
        
        return `
        <svg viewBox="-60 -60 520 380" xmlns="http://www.w3.org/2000/svg" font-family="Times New Roman, serif" font-size="16">
            <defs>
                <marker id="arrowVec_${uniqueId}" markerWidth="12" markerHeight="12" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L10,3 z" fill="black" />
                </marker>
                <marker id="arrowP_${uniqueId}" markerWidth="14" markerHeight="14" refX="12" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M0,0 L0,8 L12,4 z" fill="#27ae60" /> <!-- Poids Vert -->
                </marker>
                <marker id="arrowR_${uniqueId}" markerWidth="14" markerHeight="14" refX="12" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M0,0 L0,8 L12,4 z" fill="#c0392b" /> <!-- Reaction Rouge -->
                </marker>
                <marker id="arrowF_${uniqueId}" markerWidth="14" markerHeight="14" refX="12" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M0,0 L0,8 L12,4 z" fill="#2980b9" /> <!-- Frottement Bleu -->
                </marker>
            </defs>

            <!-- Sol et Plan -->
            <path d="M0,${height} L${base},${height} L0,0 Z" fill="#ecf0f1" stroke="black" stroke-width="2.5" />
            <line x1="-20" y1="${height}" x2="${base + 20}" y2="${height}" stroke="black" stroke-width="2.5" />
            
            <!-- Angle Alpha -->
            <path d="M${base - 60},${height} A 60 60 0 0 0 ${base - 55},${height - 25}" fill="none" stroke="black" stroke-width="1.5" />
            <text x="${base - 50}" y="${height - 10}" font-size="18">α</text>

            <!-- Repère (O, i) parallèle au plan -->
            <g transform="translate(20, 20) rotate(${25})">
                <line x1="0" y1="0" x2="60" y2="0" stroke="black" stroke-width="1.5" marker-end="url(#arrowVec_${uniqueId})" />
                <text x="65" y="5" font-style="italic" font-weight="bold">x</text>
                <text x="-15" y="5" font-style="italic" font-weight="bold">O</text>
            </g>

            <!-- Solide S (Centre de gravité G) -->
            <!-- Position sur la pente -->
            <g transform="translate(${base/2}, ${height/2}) rotate(${25})">
                <rect x="-30" y="-18" width="60" height="36" fill="#bdc3c7" stroke="black" stroke-width="2.5" />
                <circle cx="0" cy="0" r="3" fill="black" />
                <text x="-8" y="-25" font-weight="bold" font-size="18">S</text>
                <text x="8" y="5" font-size="14" font-style="italic" font-weight="bold">G</text>

                <!-- Vecteur R (Normale) -->
                <line x1="0" y1="0" x2="0" y2="-60" stroke="#c0392b" stroke-width="3" marker-end="url(#arrowR_${uniqueId})" />
                <text x="5" y="-65" fill="#c0392b" font-weight="bold" font-size="18">R_N</text>

                <!-- Vecteur f (Frottement, opposé au mouvement descendant) -->
                <line x1="0" y1="18" x2="-50" y2="18" stroke="#2980b9" stroke-width="3" marker-end="url(#arrowF_${uniqueId})" />
                <text x="-50" y="35" fill="#2980b9" font-weight="bold" font-size="18">f</text>
            </g>

            <!-- Vecteur P (Vertical, donc on annule la rotation du groupe parent) -->
            <!-- On doit calculer la position absolue de G pour dessiner P verticalement -->
            <g transform="translate(${base/2}, ${height/2})">
                 <!-- Poids P (Vertical vers le bas) -->
                 <!-- Attention: le repère SVG a y vers le bas. -->
                 <line x1="0" y1="0" x2="0" y2="80" stroke="#27ae60" stroke-width="3" marker-end="url(#arrowP_${uniqueId})" />
                 <text x="10" y="80" fill="#27ae60" font-weight="bold" font-size="18">P</text>
            </g>

        </svg>
        `;
    },

    // Schéma Chimie (Dosage/Bécher)
    beaker: (formula: string, concentration: string) => {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        return `
        <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif">
            <!-- Bécher -->
            <path d="M50,60 L50,180 Q50,195 65,195 L135,195 Q150,195 150,180 L150,60" fill="none" stroke="black" stroke-width="2" />
            <ellipse cx="100" cy="60" rx="50" ry="10" fill="none" stroke="black" stroke-width="1" />
            
            <!-- Liquide -->
            <path d="M52,100 L52,180 Q52,193 65,193 L135,193 Q148,193 148,180 L148,100" fill="#d1f2eb" stroke="none" />
            <ellipse cx="100" cy="100" rx="48" ry="8" fill="#a3e4d7" stroke="none" />
            
            <!-- Agitateur magnétique (barreau) -->
            <rect x="85" y="185" width="30" height="6" rx="2" fill="white" stroke="black" />

            <!-- Électrode pH-mètre -->
            <rect x="110" y="20" width="8" height="140" fill="#ecf0f1" stroke="black" />
            <rect x="105" y="10" width="18" height="30" fill="#95a5a6" stroke="black" />
            <line x1="114" y1="10" x2="114" y2="-10" stroke="black" stroke-width="2" /> <!-- Fil -->
            <text x="125" y="40" font-size="12">pH-mètre</text>

            <!-- Légende Solution -->
            <line x1="148" y1="130" x2="180" y2="130" stroke="black" stroke-width="1" />
            <text x="185" y="135" font-size="12" font-weight="bold">Solution (S)</text>
            <text x="185" y="150" font-size="11" font-style="italic">${formula}</text>
            <text x="185" y="165" font-size="11">C = ${concentration}</text>
        </svg>
        `;
    }
};

// --- MOTEUR DE TEMPLATES DYNAMIQUES ---

interface TemplateGenerator {
    subjects: string[]; // Supporte plusieurs matières ou alias
    keywords: string[]; // Mots clés du chapitre pour matcher
    minLevel?: string;  // Pour filtrer (ex: ne pas donner de nombres complexes au collège)
    generate: (options: ExerciseOptions) => Exercise;
}

const TEMPLATES: TemplateGenerator[] = [
    // =========================================================================
    // ----------------------- PHYSIQUE (STYLE ALLOSCHOOL) ---------------------
    // =========================================================================
    
    // --- ÉLECTRICITÉ : DIPÔLE RL (2 BAC) ---
    {
        subjects: ["Physique", "Physique-Chimie"],
        keywords: ["Dipôle RL", "Bobine", "Inductance", "Électricité", "2ème Année Bac"],
        generate: () => {
            // Paramètres aléatoires réalistes
            const E = pickOne([6, 9, 12]); // Tension générateur (V)
            const r = randomInt(5, 20); // Résistance interne bobine (Ohm)
            const R = pickOne([40, 50, 80, 100]); // Conducteur ohmique (Ohm)
            const L = pickOne([0.1, 0.2, 0.5, 1.0]); // Inductance (H)
            
            const R_tot = R + r;
            const I_max = E / R_tot; // Courant permanent
            const tau = L / R_tot;   // Constante de temps
            const E_mag_max = 0.5 * L * I_max * I_max; // Energie magnétique max

            return {
                title: "Exercice : Réponse d'un dipôle RL à un échelon de tension (National Style)",
                illustrationSVG: svgs.rlCircuit(E, R, r),
                enonce: `## Étude d'un circuit comportant une bobine\n\nOn réalise le montage expérimental schématisé ci-dessus comportant :\n- Un générateur idéal de tension de force électromotrice $E = ${E}\\ V$.\n- Une bobine d'inductance $L$ et de résistance $r$.\n- Un conducteur ohmique de résistance $R = ${R}\\ \\Omega$.\n- Un interrupteur $K$.\n\nÀ l'instant $t=0$, on ferme l'interrupteur $K$. Un système d'acquisition informatisé permet de tracer la courbe d'évolution de l'intensité du courant $i(t)$ traversant le circuit.\n\n**Données :**\n- La résistance interne de la bobine est $r = ${r}\\ \\Omega$.\n- Le régime permanent est atteint après une durée $5\\tau$.\n\n1. En exploitant la loi d'additivité des tensions, montrer que l'équation différentielle vérifiée par l'intensité $i(t)$ s'écrit :\n   $$ \\frac{di}{dt} + \\frac{R+r}{L} i = \\frac{E}{L} $$\n2. Vérifier que la solution de cette équation différentielle est de la forme : $i(t) = I_{max}(1 - e^{-t/\\tau})$ où $\\tau$ est la constante de temps du circuit.\n3. Exprimer $I_{max}$ et $\\tau$ en fonction des paramètres du circuit ($E, R, r, L$).\n4. Calculer la valeur de l'intensité $I_{max}$ en régime permanent.\n5. L'analyse de la courbe expérimentale donne une constante de temps $\\tau = ${toSci(tau)}\\ s$. En déduire la valeur de l'inductance $L$.\n6. Calculer l'énergie magnétique $E_m$ emmagasinée dans la bobine en régime permanent.`,
                corrige: `## Correction Détaillée\n\n1. **Équation différentielle** :\n   D'après la loi d'additivité des tensions (maille) : $u_L + u_R = E$\n   On a $u_R = R.i$ et $u_L = L\\frac{di}{dt} + r.i$.\n   Donc : $L\\frac{di}{dt} + r.i + R.i = E \\Rightarrow L\\frac{di}{dt} + (R+r)i = E$\n   En divisant par $L$, on obtient l'équation : **$\\frac{di}{dt} + \\frac{R+r}{L}i = \\frac{E}{L}$**.\n\n2. **Vérification de la solution** :\n   Si $i(t) = I_{max}(1 - e^{-t/\\tau})$, alors $\\frac{di}{dt} = \\frac{I_{max}}{\\tau}e^{-t/\\tau}$.\n   En remplaçant dans l'équation : $\\frac{I_{max}}{\\tau}e^{-t/\\tau} + \\frac{1}{\\tau} I_{max}(1 - e^{-t/\\tau}) = \\frac{I_{max}}{\\tau} \\neq \\frac{E}{L}$ (Identification nécessaire).\n\n3. **Expressions** :\n   Par identification avec l'équation différentielle :\n   - $\\tau = \\frac{L}{R+r}$ (Constante de temps)\n   - $I_{max} = \\frac{E}{R+r}$ (Intensité maximale)\n\n4. **Calcul de $I_{max}$** :\n   $I_{max} = \\frac{${E}}{${R} + ${r}} = \\frac{${E}}{${R_tot}} \\approx \\mathbf{${I_max.toFixed(3)}\\ A}$.\n\n5. **Calcul de $L$** :\n   On sait que $\\tau = \\frac{L}{R+r} \\Rightarrow L = \\tau(R+r)$.\n   $L = ${toSci(tau)} \\times ${R_tot} = \\mathbf{${L}\\ H}$.\n\n6. **Énergie magnétique** :\n   $E_m = \\frac{1}{2} L I_{max}^2 = 0,5 \\times ${L} \\times (${I_max.toFixed(3)})^2$\n   $E_m \\approx \\mathbf{${toSci(E_mag_max)} \\ J}$.`
            };
        }
    },

    // --- CHIMIE : ACIDE-BASE (2 BAC) ---
    {
        subjects: ["Chimie", "Physique-Chimie"],
        keywords: ["Acide", "Base", "pH", "Réaction", "2ème Année Bac", "Transformations"],
        generate: () => {
            // Acide éthanoïque (classique) ou Méthanoïque
            const acidName = Math.random() > 0.5 ? "acide éthanoïque" : "acide méthanoïque";
            const formula = acidName.includes("éthanoïque") ? "CH_3COOH" : "HCOOH";
            const baseFormula = acidName.includes("éthanoïque") ? "CH_3COO^-" : "HCOO^-";
            
            const C = pickOne([1e-2, 5e-2, 1e-3]); // mol/L
            const V = pickOne([100, 200, 500]); // mL (pour le contexte)
            
            // Simulation d'un pH réaliste pour un acide faible
            // pH = 1/2 (pKa - log C) approx, mais on fixe des valeurs "mesurées"
            const measured_pH = acidName.includes("éthanoïque") 
                ? (C === 1e-2 ? 3.4 : 2.9) 
                : (C === 1e-2 ? 2.9 : 2.4);
            
            const x_max = C * (V / 1000); // En mol
            const x_eq = Math.pow(10, -measured_pH) * (V / 1000); // En mol (via [H3O+])
            const tau = x_eq / x_max;
            
            // Calcul du Qr,eq (Ka)
            // Ka = [H3O+]^2 / (C - [H3O+])
            const h3o = Math.pow(10, -measured_pH);
            const Ka = (h3o * h3o) / (C - h3o);
            const pKa = -Math.log10(Ka);

            return {
                title: `Exercice : Étude d'une solution d'${acidName} (7 pts)`,
                illustrationSVG: svgs.beaker(formula, `${toSci(C)} mol/L`),
                enonce: `## Transformation chimique d'un acide avec l'eau\n\nOn prépare une solution aqueuse $(S)$ d'${acidName} de volume $V = ${V}\\ mL$ et de concentration molaire apportée $C = ${toSci(C)}\\ mol.L^{-1}$.\nLa mesure du pH de la solution à $25^{\\circ}C$ donne : $pH = ${measured_pH}$.\n\n1. Écrire l'équation de la réaction de l'${acidName} avec l'eau.\n2. Dresser le tableau d'avancement de cette réaction en utilisant les variables $C$, $V$, $x$ et $x_{eq}$.\n3. Exprimer le taux d'avancement final $\\tau$ de la réaction en fonction du $pH$ et de la concentration $C$.\n4. Calculer la valeur de $\\tau$. La transformation est-elle totale ou limitée ? Justifier.\n5. Montrer que le quotient de réaction à l'équilibre $Q_{r,eq}$ s'écrit :\n   $$ Q_{r,eq} = \\frac{10^{-2pH}}{C - 10^{-pH}} $$\n6. Calculer la valeur de la constante d'acidité $pK_A$ du couple ${formula}/${baseFormula}$.`,
                corrige: `## Correction\n\n1. **Équation de réaction** :\n   $$ ${formula}_{(aq)} + H_2O_{(l)} \\rightleftarrows ${baseFormula}_{(aq)} + H_3O^+_{(aq)} $$\n\n2. **Tableau d'avancement** :\n   - **État initial** ($x=0$) : $n(${formula}) = C.V$, Eau = Excès, Produits = 0.\n   - **État final** ($x_{eq}$) : $n(${formula}) = C.V - x_{eq}$, $n(H_3O^+) = n(${baseFormula}) = x_{eq}$.\n\n3. **Expression de $\\tau$** :\n   $\\tau = \\frac{x_{eq}}{x_{max}}$.\n   Or $x_{max} = C.V$ (réactif limitant) et $x_{eq} = [H_3O^+]_{eq}.V = 10^{-pH}.V$.\n   $\\Rightarrow \\tau = \\frac{10^{-pH}.V}{C.V} = \\mathbf{\\frac{10^{-pH}}{C}}$.\n\n4. **Calcul de $\\tau$** :\n   $\\tau = \\frac{10^{-${measured_pH}}}{${toSci(C)}} \\approx \\mathbf{${tau.toFixed(3)}}$.\n   Puisque $\\tau < 1$ (soit ${Math.round(tau*100)}%), la transformation est **limitée**.\n\n5. **Quotient de réaction $Q_{r,eq}$** :\n   $Q_{r,eq} = \\frac{[${baseFormula}]_{eq}.[H_3O^+]_{eq}}{[${formula}]_{eq}} = \\frac{[H_3O^+]_{eq}^2}{C - [H_3O^+]_{eq}}$\n   En remplaçant $[H_3O^+]_{eq}$ par $10^{-pH}$, on obtient : **$Q_{r,eq} = \\frac{10^{-2pH}}{C - 10^{-pH}}$**.\n\n6. **Calcul du $pK_A$** :\n   À l'équilibre, $K_A = Q_{r,eq}$.\n   $K_A = \\frac{10^{-${2*measured_pH}}}{${toSci(C)} - 10^{-${measured_pH}}} \\approx ${toSci(Ka)}$.\n   $pK_A = -\\log(K_A) \\approx \\mathbf{${pKa.toFixed(2)}}$.`
            };
        }
    },

    // --- MÉCANIQUE : NEWTON (2 BAC / 1 BAC) ---
    {
        subjects: ["Physique", "Physique-Chimie"],
        keywords: ["Newton", "Mécanique", "Plan incliné", "Forces", "Lycée"],
        generate: () => {
            const m = randomInt(50, 200); // kg (ex: skieur)
            const alpha = pickOne([20, 30, 45]); // degrés
            const g = 9.8; // m/s² (ou 10)
            const f = randomInt(10, 50); // Force de frottement (N)
            
            // Accélération a = g*sin(alpha) - f/m
            const alphaRad = alpha * (Math.PI / 180);
            const a_theo = g * Math.sin(alphaRad) - (f / m);
            
            return {
                title: "Exercice : Mouvement sur un plan incliné (Mécanique)",
                illustrationSVG: svgs.inclinedPlane(alpha, m),
                enonce: `## Application de la 2ème loi de Newton\n\nUn solide $(S)$ de masse $m = ${m}\\ kg$ glisse vers le bas le long d'un plan incliné d'un angle $\\alpha = ${alpha}^{\\circ}$ par rapport à l'horizontale.\nLe mouvement se fait **avec frottements**, modélisés par une force constante $\\vec{f}$ de norme $f = ${f}\\ N$, parallèle à la trajectoire et opposée au sens du mouvement.\n\nDonnée : Intensité de la pesanteur $g = 9,8\\ m.s^{-2}$.\n\n1. Faire le bilan des forces exercées sur le solide $(S)$ et les représenter sur un schéma (voir ci-dessus).\n2. En appliquant la deuxième loi de Newton dans un référentiel terrestre supposé galiléen lié au plan, déterminer l'expression de l'accélération $a_G$ du centre d'inertie du solide en fonction de $g, \\alpha, m$ et $f$.\n3. Calculer la valeur de l'accélération $a_G$.\n4. Sachant que le solide part du repos ($v_0 = 0$) à l'instant $t=0$, déterminer l'équation horaire de la vitesse $v(t)$.\n5. En déduire la nature du mouvement.`,
                corrige: `## Correction\n\n1. **Bilan des forces** :\n   - Le Poids $\\vec{P}$ : vertical, vers le bas.\n   - La Réaction du plan $\\vec{R}$ : se décompose en $\\vec{R_N}$ (normale au plan) et $\\vec{f}$ (tangentielle, force de frottement).\n\n2. **Application de la 2ème loi de Newton** :\n   $\\sum \\vec{F}_{ext} = m.\\vec{a}_G \\Rightarrow \\vec{P} + \\vec{R_N} + \\vec{f} = m.\\vec{a}_G$\n   \n   **Projection sur l'axe $(Ox)$** parallèle à la ligne de plus grande pente et dirigé vers le bas :\n   $P_x + R_{Nx} + f_x = m.a_x$\n   $m.g.\\sin(\\alpha) + 0 - f = m.a_G$\n   $\\Rightarrow a_G = g.\\sin(\\alpha) - \\frac{f}{m}$\n\n3. **Calcul** :\n   $a_G = 9,8 \\times \\sin(${alpha}^{\\circ}) - \\frac{${f}}{${m}}$\n   $a_G \\approx 9,8 \\times ${Math.sin(alphaRad).toFixed(2)} - ${(f/m).toFixed(2)}\n   $a_G \\approx \\mathbf{${a_theo.toFixed(2)}\\ m.s^{-2}}$.\n\n4. **Équation de la vitesse** :\n   Puisque $a_G = cte$, on a $v(t) = a_G.t + v_0$.\n   Avec $v_0 = 0$, on obtient : $\\mathbf{v(t) = ${a_theo.toFixed(2)}.t}$.\n\n5. **Nature du mouvement** :\n   La trajectoire est rectiligne et l'accélération est constante et positive ($a_G > 0$).\n   Il s'agit donc d'un mouvement **rectiligne uniformément accéléré**.`
            };
        }
    },

    // =========================================================================
    // ----------------------- MATHÉMATIQUES LYCÉE -----------------------------
    // =========================================================================
    {
        subjects: ["Mathématiques"],
        keywords: ["Complexe", "Complexes", "2ème Année Bac"],
        generate: () => {
            // Générer une équation az^2 + bz + c = 0 avec Delta < 0 (Solutions complexes)
            // Pour avoir des calculs propres, on fixe Delta = -(k^2)
            // Delta = b^2 - 4ac. On choisit a=1 pour simplifier.
            // b^2 - 4c = -k^2  => 4c = b^2 + k^2
            
            // Astuce: On génère une racine z1 = u + iv. L'autre est z2 = u - iv.
            // (z - (u+iv))(z - (u-iv)) = ((z-u) - iv)((z-u) + iv) = (z-u)^2 + v^2
            // z^2 - 2uz + u^2 + v^2 = 0
            
            const u = randomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
            const v = randomInt(1, 4); // Partie imaginaire non nulle
            
            const b = -2 * u;
            const c = u*u + v*v;
            const delta = b*b - 4*c; // Sera forcément négatif et carré parfait
            const k = Math.sqrt(Math.abs(delta));

            return {
                title: "Exercice : Nombres Complexes (3 pts)",
                enonce: `## Résolution dans $\\mathbb{C}$\n\n1. Résoudre dans l'ensemble des nombres complexes $\\mathbb{C}$ l'équation suivante :\n   $$ z^2 ${b >= 0 ? '+' : ''}${b}z + ${c} = 0 $$\n\n2. Écrire les solutions sous forme trigonométrique (si possible) ou algébrique.`,
                corrige: `## Correction\n\n1. **Calcul du discriminant** $\\Delta$ :\n   $\\Delta = b^2 - 4ac = (${b})^2 - 4(1)(${c}) = ${b*b} - ${4*c} = ${delta}$\n\n   Comme $\\Delta < 0$, l'équation admet deux solutions complexes conjuguées :\n   $$ z_1 = \\frac{-b - i\\sqrt{|\\Delta|}}{2a} = \\frac{${-b} - i\\sqrt{${Math.abs(delta)}}}{2} = \\frac{${-b} - ${k}i}{2} = \\mathbf{${u} - ${v}i} $$\n   $$ z_2 = \\overline{z_1} = \\mathbf{${u} + ${v}i} $$\n\n2. **Ensemble des solutions** :\n   $S = \\{ ${u} - ${v}i ; ${u} + ${v}i \\}$`
            };
        }
    },
    {
        subjects: ["Mathématiques"],
        keywords: ["Analyse", "Fonction", "Dérivation", "Bac"],
        generate: () => {
            // f(x) = x^3 + ax^2 + bx + c
            const a = randomInt(-5, 5);
            const b = randomInt(-10, 10);
            const c = randomInt(-5, 5);
            
            return {
                title: "Exercice : Étude de fonction (4 pts)",
                enonce: `## Étude d'une fonction polynôme\n\nSoit $f$ la fonction numérique définie sur $\\mathbb{R}$ par :\n$$ f(x) = x^3 ${a >= 0 ? '+' : ''}${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} $$\n\n1. Calculer la limite de $f$ en $+\\infty$ et en $-\\infty$.\n2. Calculer la fonction dérivée $f'(x)$.\n3. Déterminer l'équation de la tangente $(T)$ à la courbe $C_f$ au point d'abscisse $x_0 = 0$.`,
                corrige: `## Correction\n\n1. **Limites** :\n   $\\lim_{x \\to +\\infty} f(x) = \\lim_{x \\to +\\infty} x^3 = +\\infty$\n   $\\lim_{x \\to -\\infty} f(x) = \\lim_{x \\to -\\infty} x^3 = -\\infty$\n\n2. **Dérivée** :\n   $f$ est dérivable sur $\\mathbb{R}$.\n   $$ f'(x) = 3x^2 ${2*a >= 0 ? '+' : ''}${2*a}x ${b >= 0 ? '+' : ''}${b} $$\n\n3. **Équation de la tangente** en $0$ :\n   $y = f'(0)(x - 0) + f(0)$\n   Or $f'(0) = ${b}$ et $f(0) = ${c}$.\n   Donc $(T) : y = ${b}x ${c >= 0 ? '+' : ''}${c}$.`
            };
        }
    },

    // =========================================================================
    // ----------------------- MATHÉMATIQUES COLLÈGE ---------------------------
    // =========================================================================
    {
        subjects: ["Mathématiques"],
        keywords: ["Collège", "Affine", "Fonctions", "3ème"],
        generate: () => {
            const a = randomInt(2, 5);
            const b = randomInt(-3, 3);
            const x1 = randomInt(1, 4);
            const y1 = a * x1 + b;
            
            return {
                title: "Exercice : Fonctions Affines (3 pts)",
                enonce: `## Fonction Affine\n\nSoit $f$ une fonction affine telle que $f(${x1}) = ${y1}$ et son coefficient directeur est $a = ${a}$.\n\n1. Déterminer l'expression algébrique de $f(x)$.\n2. Calculer l'image de 0 par la fonction $f$.\n3. Déterminer le nombre dont l'image par $f$ est ${y1 + a * 2}.`,
                corrige: `## Correction\n\n1. **Expression de f(x)** :\n   On sait que $f(x) = ax + b$. Ici $a = ${a}$, donc $f(x) = ${a}x + b$.\n   Or $f(${x1}) = ${y1}$, donc ${a}(${x1}) + b = ${y1} \\Rightarrow ${a*x1} + b = ${y1} \\Rightarrow b = ${y1} - ${a*x1} = ${b}$.\n   Conclusion : $\\mathbf{f(x) = ${a}x ${b >= 0 ? '+' : ''}${b}}$.\n\n2. **Image de 0** :\n   $f(0) = ${a}(0) ${b >= 0 ? '+' : ''}${b} = ${b}$.\n\n3. **Antécédent** :\n   On cherche $x$ tel que $f(x) = ${y1 + a * 2}$.\n   $${a}x ${b >= 0 ? '+' : ''}${b} = ${y1 + a * 2} \\Rightarrow ${a}x = ${y1 + a * 2 - b} \\Rightarrow x = \\frac{${y1 + a * 2 - b}}{${a}} = ${x1 + 2}$.`
            };
        }
    },

    // =========================================================================
    // ----------------------- PHYSIQUE-CHIMIE (GÉNÉRAL / COLLÈGE) -------------
    // =========================================================================
    {
        subjects: ["Physique", "Physique-Chimie"],
        keywords: ["Nucléaire", "Radioactivité", "Bac", "Décroissance"],
        generate: () => {
            const el = pickOne([{ sym: "C", A: 14, Z: 6, fil: "N", filZ: 7 }, { sym: "I", A: 131, Z: 53, fil: "Xe", filZ: 54 }]);
            const t_half = el.sym === "C" ? 5730 : 8;
            const unit = el.sym === "C" ? "ans" : "jours";
            
            return {
                title: "Exercice : Désintégration Radioactive (3 pts)",
                enonce: `## Transformation Nucléaire\n\nLe noyau de ${el.sym === "C" ? "Carbone" : "Iode"} $_{${el.Z}}^{${el.A}}$${el.sym} est radioactif. Il se désintègre pour donner un noyau de ${el.fil === "N" ? "Azote" : "Xénon"} $_{${el.filZ}}^{${el.A}}$${el.fil}.\n\nDonnées : $t_{1/2} = ${t_half}$ ${unit}.\n\n1. Écrire l'équation de désintégration et préciser le type de radioactivité ($\\alpha$, $\\beta^-$ ou $\\beta^+$).\n2. Définir le temps de demi-vie $t_{1/2}$.\n3. Au bout de combien de temps ne restera-t-il que 25% des noyaux initiaux ?`,
                corrige: `## Correction\n\n1. **Équation** :\n   $$_{${el.Z}}^{${el.A}}$${el.sym} \\rightarrow _{${el.filZ}}^{${el.A}}$${el.fil} + _{-1}^{0}e$$\n   C'est une radioactivité de type **$\\beta^-$** (émission d'un électron).\n\n2. **Définition** :\n   Le temps de demi-vie est la durée nécessaire pour que la moitié des noyaux radioactifs d'un échantillon se désintègrent.\n\n3. **Calcul de durée** :\n   Il reste 25% (soit $1/4$). Cela correspond à 2 demi-vies ($100\\% \\rightarrow 50\\% \\rightarrow 25\\%$).\n   $t = 2 \\times t_{1/2} = 2 \\times ${t_half} = \\mathbf{${2 * t_half}\\ ${unit}}$.`
            };
        }
    },
    {
        subjects: ["Physique", "Physique-Chimie"],
        keywords: ["Collège", "Poids", "Masse", "Mécanique"],
        generate: () => {
            const objects = [
                { name: "une pomme", m_g: 150 },
                { name: "un cartable", m_g: 4500 },
                { name: "un smartphone", m_g: 200 }
            ];
            const obj = pickOne(objects);
            const g_terre = 9.8;
            const g_lune = 1.6;
            const P_terre = (obj.m_g / 1000) * g_terre;

            return {
                title: "Exercice : Poids et Masse (3 pts)",
                enonce: `## Différence Poids / Masse\n\nOn considère ${obj.name} de masse $m = ${obj.m_g}\\ g$.\nDonnées : $g_{Terre} = 9,8\\ N.kg^{-1}$ ; $g_{Lune} = 1,6\\ N.kg^{-1}$.\n\n1. Convertir la masse en kilogrammes (kg).\n2. Calculer le poids $P$ de l'objet sur Terre.\n3. La masse de l'objet change-t-elle si on le transporte sur la Lune ? Justifier.`,
                corrige: `## Correction\n\n1. **Conversion** :\n   $m = ${obj.m_g}\\ g = \\mathbf{${obj.m_g / 1000}\\ kg}$.\n\n2. **Calcul du poids sur Terre** :\n   $P = m \\times g = ${obj.m_g / 1000} \\times 9,8 = \\mathbf{${P_terre.toFixed(2)}\\ N}$.\n\n3. **Sur la Lune** :\n   **Non**, la masse est une grandeur invariable qui dépend de la quantité de matière. Elle reste ${obj.m_g / 1000}\\ kg$. Seul le poids changerait.`
            };
        }
    },
    {
        subjects: ["Chimie", "Physique-Chimie"],
        keywords: ["Mole", "Molaire", "Matière", "Lycée", "Quantité"],
        generate: () => {
            const molecules = [
                { name: "Eau", form: "H_2O", M: 18 },
                { name: "Méthane", form: "CH_4", M: 16 },
                { name: "Dioxyde de carbone", form: "CO_2", M: 44 }
            ];
            const mol = pickOne(molecules);
            const n = randomFloat(0.1, 2.0, 1);
            const m = n * mol.M;

            return {
                title: "Exercice : Quantité de matière (2 pts)",
                enonce: `## Calcul de quantité de matière\n\nOn considère un échantillon de ${mol.name} (Formule : $${mol.form}$) de quantité de matière $n = ${n}\\ mol$.\n\nDonnées : Masses molaires atomiques : $M(H)=1$, $M(C)=12$, $M(O)=16 \\ g.mol^{-1}$.\n\n1. Calculer la masse molaire moléculaire $M(${mol.form})$.\n2. En déduire la masse $m$ de cet échantillon.`,
                corrige: `## Correction\n\n1. **Masse molaire** :\n   $M(${mol.form}) = ${mol.M}\\ g.mol^{-1}$ (Calcul à partir des données).\n\n2. **Calcul de la masse** :\n   On utilise la formule $n = \\frac{m}{M} \\Rightarrow m = n \\times M$.\n   $m = ${n} \\times ${mol.M} = \\mathbf{${m.toFixed(1)}\\ g}$.`
            };
        }
    },

    // =========================================================================
    // ----------------------- LANGUES / SVT (SIMPLE) --------------------------
    // =========================================================================
    {
        subjects: ["Français"],
        keywords: ["Grammaire", "Voix", "Active", "Passive"],
        generate: () => {
            const phrases = [
                { active: "Le professeur explique la leçon.", passive: "La leçon est expliquée par le professeur." },
                { active: "Le chat a mangé la souris.", passive: "La souris a été mangée par le chat." },
                { active: "L'élève fera les exercices.", passive: "Les exercices seront faits par l'élève." }
            ];
            const p = pickOne(phrases);

            return {
                title: "Exercice : Voix Active et Passive",
                enonce: `## Transformation Grammaticale\n\nTransformez la phrase suivante à la voix passive :\n\n> "${p.active}"\n\n*Attention à l'accord du participe passé et au temps du verbe.*`,
                corrige: `## Correction\n\n**Phrase à la voix passive :**\n\n> "${p.passive}"\n\n**Explication :**\n- Le COD ("${p.active.split(' ').slice(2).join(' ').replace('.', '')}") devient le sujet.\n- L'auxiliaire être est conjugué au même temps que le verbe de la voix active.\n- Le participe passé s'accorde avec le nouveau sujet.`
            };
        }
    },
    {
        subjects: ["SVT"],
        keywords: ["Immunologie", "Géologie", "SVT", "Bac"],
        generate: () => {
            const db = [
                { q: "L'immunité innée est :", a: "Non spécifique et immédiate", false: ["Spécifique et lente", "Acquise après vaccination", "Absente à la naissance"] },
                { q: "Le VIH attaque principalement :", a: "Les lymphocytes T4", false: ["Les globules rouges", "Les macrophages uniquement", "Les plaquettes"] },
                { q: "La lithosphère est constituée de :", a: "La croûte et du manteau supérieur rigide", false: ["La croûte uniquement", "L'asthénosphère", "Noyau externe"] },
                { q: "La subduction correspond à :", a: "L'enfoncement d'une plaque océanique sous une autre", false: ["L'écartement de deux plaques", "La collision de deux continents", "La formation d'un rift"] }
            ];
            
            const selection = pickMultiple(db, 3);
            
            let enonce = "## QCM de Connaissances (3 pts)\n\nCochez la bonne réponse pour chaque proposition :\n\n";
            let corrige = "## Correction\n\n";
            
            selection.forEach((item, idx) => {
                const options = [item.a, ...item.false].sort(() => 0.5 - Math.random());
                enonce += `**${idx+1}. ${item.q}**\n`;
                options.forEach(opt => enonce += `- [ ] ${opt}\n`);
                enonce += "\n";
                
                corrige += `**${idx+1}. Réponse correcte :** ${item.a}\n`;
            });

            return {
                title: "Exercice : Restitution des connaissances (QCM)",
                enonce: enonce,
                corrige: corrige
            };
        }
    }
];

const GENERIC_TEMPLATE = {
    generate: (subject: string, chapter: string) => ({
        title: `Exercice de Révision : ${chapter}`,
        enonce: `## Exercice de Synthèse\n\n*Le générateur local n'a pas de modèle spécifique pour ce chapitre (${chapter}), mais voici une structure standard.*\n\n1. Définir les termes clés du chapitre **"${chapter}"**.\n2. Citer une loi ou une règle fondamentale liée à ce sujet.\n3. Application directe : Inventez un exemple simple illustrant cette loi.\n\n*(Astuce : Pour des exercices précis sur ce chapitre, connectez-vous pour utiliser le **Mode IA**)*`,
        corrige: `## Pistes de correction\n\n1. Vérifiez les définitions dans votre cours ou manuel scolaire.\n2. Assurez-vous que la formule citée est homogène aux unités.\n3. L'exemple doit être réaliste et chiffré.`
    })
};

export const generateLocalExercises = async (options: ExerciseOptions): Promise<Exercise[]> => {
  // Simuler un délai réaliste (UX)
  await new Promise(resolve => setTimeout(resolve, 600));

  const exercises: Exercise[] = [];
  
  // 1. Déterminer la liste des chapitres à générer et leur nombre
  const tasks: { chapter: string, count: number }[] = [];
  
  if (options.selectedChapters && options.selectedChapters.length > 0) {
      options.selectedChapters.forEach(c => tasks.push(c));
  } else {
      tasks.push({ chapter: options.chapter, count: options.exerciseCount || 3 });
  }

  // 2. Génération pour chaque tâche
  let totalIndex = 0;

  for (const task of tasks) {
      // Filtrage par Matière ET (Mots-clés OU Niveau) pour le chapitre spécifique
      const candidates = TEMPLATES.filter(t => 
          t.subjects.some(s => options.subject.includes(s) || s === options.subject) &&
          (
            t.keywords.some(k => task.chapter.includes(k) || options.level.includes(k) || options.subject.includes(k))
          )
      );

      for (let i = 0; i < task.count; i++) {
          let generator;
          
          if (candidates.length > 0) {
              // Rotation sur les templates disponibles
              generator = candidates[i % candidates.length];
          } else {
              // Fallback générique
              generator = { generate: () => GENERIC_TEMPLATE.generate(options.subject, task.chapter) };
          }

          const generated = generator.generate(options);
          
          exercises.push({ 
              ...generated, 
              title: generated.title || `Exercice ${totalIndex + 1} - ${task.chapter}`,
              id: `local-${Date.now()}-${totalIndex}` 
          });
          totalIndex++;
      }
  }

  return exercises;
};

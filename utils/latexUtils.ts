
/**
 * Utilitaires pour le traitement du LaTeX dans l'application
 * Centralise toutes les transformations et corrections nécessaires pour le rendu LaTeX
 */

/**
 * Nettoie et normalise le contenu LaTeX pour un rendu optimal
 * @param content - Le contenu texte contenant du LaTeX
 * @returns Le contenu avec le LaTeX nettoyé et normalisé
 */
export const cleanLatexContent = (content: string): string => {
    if (!content) return "";

    let cleaned = content
        // Conversion des délimiteurs LaTeX standards en délimiteurs Markdown ($)
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')

        // Suppression des espaces après $ ouvrant et avant $ fermant
        .replace(/\$\s+/g, '$')
        .replace(/\s+\$/g, '$')

        // Conversion de la notation scientifique en LaTeX avec braces obligatoires
        .replace(/(\d+)\.(\d+)[eE]([+-]?\d+)/g, '$1{,}$2 \\times 10^{$3}')
        .replace(/(\d+)[eE]([+-]?\d+)/g, '$1 \\times 10^{$2}')
        .replace(/(\d+)\.(\d+)\s*[\.\*x]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1{,}$2 \\times 10^{$3}')
        .replace(/(\d+)\s*[\.\*]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1 \\times 10^{$2}')
        .replace(/10\^([+-]?\d+)(?![0-9{])/g, '10^{$1}')
        .replace(/10\^\{\s*([+-]?\d+)\s*\}/g, '10^{$1}')

        // Correction des espaces dans les commandes LaTeX
        .replace(/(\d)\\([a-zA-Z]+)/g, '$1 \\$2')

        // Conversion des virgules décimales en notation LaTeX avec espaces insécables
        .replace(/(\d),(\d)/g, '$1{,}$2')

        // Conversion des unités en LaTeX avec espacement correct
        .replace(/(\d+)\s*µ\s*F/g, '$1\\,\\mu\\text{F}')
        .replace(/(\d+)\s*µ/g, '$1\\,\\mu')
        .replace(/(\d+)\s*Ω/g, '$1\\;\\Omega')
        .replace(/(\d+)\s*°C/g, '$1^{\\circ}\\text{C}')
        .replace(/(\d+)\s*%/g, '$1\\%')
        .replace(/(\d+)\s*mH/g, '$1\\;\\text{mH}')
        .replace(/(\d+)\s*nm/g, '$1\\;\\text{nm}')
        .replace(/(\d+)\s*m\/s/g, '$1\\;\\text{m/s}')

        // Correction des indices et exposants sans braces
        .replace(/_([a-zA-Z0-9])(?![{a-zA-Z0-9])/g, '_{$1}')
        .replace(/\^([a-zA-Z0-9])(?![{a-zA-Z0-9])/g, '^{$1}')
        .replace(/_\{([^}]+),([^}]+)\}/g, '_{$1{,}$2}')

        // Nettoyage des caractères spéciaux
        .replace(/\u00A0/g, ' ')
        .replace(/(\w)\$/g, '$1 $')

        // Conversion des doubles dollars en dollars simples (sauf pour les environnements complexes)
        .replace(/\$\$([^\n]{1,80}?)\$\$/g, (match, inner) => {
            if (inner.includes('\\\\') || inner.includes('\\begin{')) return match;
            return `$${inner.trim()}$`;
        });

    return cleaned;
};


/**
 * Vérifie si une chaîne contient du LaTeX
 * @param content - Le contenu à vérifier
 * @returns true si le contenu contient du LaTeX
 */
export const containsLatex = (content: string): boolean => {
    if (!content) return false;
    return /(\$|\\\(|\\\[|\\begin\{|\\[a-zA-Z]+\{)/.test(content);
};

/**
 * Extrait toutes les expressions mathématiques LaTeX d'une chaîne
 * @param content - Le contenu contenant du LaTeX
 * @returns Un tableau d'expressions LaTeX trouvées
 */
export const extractLatexExpressions = (content: string): string[] => {
    if (!content) return [];
    const matches = content.match(/\$([^$]+)\$/g) || [];
    return matches.map(match => match.replace(/^\$|\$$/g, ''));
};

/**
 * Échappe les caractères spéciaux LaTeX dans une chaîne
 * @param content - Le contenu à échapper
 * @returns Le contenu avec les caractères spéciaux échappés
 */
export const escapeLatex = (content: string): string => {
    if (!content) return "";
    const specialChars = ['\\', '&', '%', '$', '#', '_', '{', '}', '~', '^'];
    let escaped = content;
    specialChars.forEach(char => {
        escaped = escaped.replace(new RegExp(`\\\\${char}`, 'g'), `\\\\${char}`);
    });
    return escaped;
};


/**
 * Convertit les expressions mathématiques simples en LaTeX
 * @param content - Le contenu contenant des expressions mathématiques simples
 * @returns Le contenu avec les expressions converties en LaTeX
 */
export const convertSimpleMathToLatex = (content: string): string => {
    if (!content) return "";

    let converted = content
        // Fractions simples (a/b) -> \frac avec display style pour meilleure lisibilité
        .replace(/(\d+)\s*\/\s*(\d+)/g, '\\dfrac{$1}{$2}')
        // Racine carrée
        .replace(/√(\d+)/g, '\\sqrt{$1}')
        // Puissances simples (x^2) avec braces
        .replace(/([a-zA-Z])\^(\d+)/g, '$1^{$2}')
        // Indices simples (x_1) avec braces
        .replace(/([a-zA-Z])_(\d+)/g, '$1_{$2}');

    return converted;
};

/**
 * Formate les données scientifiques avec unités pour KaTeX
 * @param value - La valeur numérique
 * @param unit - L'unité (Ω, mH, µF, nm, etc.)
 * @returns La chaîne formatée en LaTeX
 */
export const formatScientificValue = (value: string | number, unit: string): string => {
    const valStr = value.toString().replace(',', '{,}');
    
    const unitMap: Record<string, string> = {
        'Ω': '\\Omega',
        'ohm': '\\Omega',
        'mH': '\\text{mH}',
        'µF': '\\mu\\text{F}',
        'uF': '\\mu\\text{F}',
        'microF': '\\mu\\text{F}',
        'nm': '\\text{nm}',
        'mm': '\\text{mm}',
        'cm': '\\text{cm}',
        'm': '\\text{m}',
        'km': '\\text{km}',
        'm/s': '\\text{m/s}',
        'km/h': '\\text{km/h}',
        's': '\\text{s}',
        'ms': '\\text{ms}',
        'µs': '\\mu\\text{s}',
        'us': '\\mu\\text{s}',
        'A': '\\text{A}',
        'mA': '\\text{mA}',
        'V': '\\text{V}',
        'mV': '\\text{mV}',
        'kV': '\\text{kV}',
        'W': '\\text{W}',
        'kW': '\\text{kW}',
        'MW': '\\text{MW}',
        'Hz': '\\text{Hz}',
        'kHz': '\\text{kHz}',
        'MHz': '\\text{MHz}',
        'GHz': '\\text{GHz}',
        '°C': '^{\\circ}\\text{C}',
        'degC': '^{\\circ}\\text{C}',
        '%': '\\%'
    };

    const latexUnit = unitMap[unit] || `\\text{${unit}}`;
    
    // Utiliser \, pour les unités avec symboles grecs, \; pour les autres
    const space = unit.includes('µ') || unit.includes('mu') ? '\\,' : '\\;';
    
    return `$${valStr}${space}${latexUnit}$`;
};

/**
 * Corrige les caractères scientifiques spéciaux pour KaTeX
 * @param content - Le contenu à corriger
 * @returns Le contenu avec les caractères scientifiques corrigés
 */
export const fixScientificCharacters = (content: string): string => {
    if (!content) return "";

    return content
        // Indices avec virgule (λ_0,1 -> λ_{0,1})
        .replace(/λ_{([0-9]+),([0-9]+)}/g, 'λ_{$1{,}$2}')
        .replace(/\\lambda_{([0-9]+),([0-9]+)}/g, '\\lambda_{$1{,}$2}')
        // Résistance R_0 -> R_{0}
        .replace(/R_([0-9]+)(?![{a-zA-Z0-9])/g, 'R_{$1}')
        // Indice de réfraction n_1, n_2 -> n_{1}, n_{2}
        .replace(/n_([0-9]+)(?![{a-zA-Z0-9])/g, 'n_{$1}')
        // Vitesse c = 3,00 -> c = 3{,}00
        .replace(/=\s*([0-9]+),([0-9]+)/g, '= $1{,}$2');
};

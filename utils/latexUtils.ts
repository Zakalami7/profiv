
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

        // Conversion de la notation scientifique en LaTeX
        .replace(/(\d+)\.(\d+)[eE]([+-]?\d+)/g, '$1,$2 \times 10^{$3}')
        .replace(/(\d+)[eE]([+-]?\d+)/g, '$1 \times 10^{$2}')
        .replace(/(\d+)\.(\d+)\s*[\.\*x]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1,$2 \times 10^{$3}')
        .replace(/(\d+)\s*[\.\*]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1 \times 10^{$2}')
        .replace(/10\^([+-]?\d+)(?![0-9{])/g, '10^{$1}')
        .replace(/10\^\{\s*([+-]?\d+)\s*\}/g, '10^{$1}')

        // Correction des espaces dans les commandes LaTeX
        .replace(/(\d)\\([a-zA-Z]+)/g, '$1 \\$2')

        // Conversion des unités en LaTeX
        .replace(/(\d+)\s*Ω/g, '$1\\ \Omega')
        .replace(/(\d+)\s*°C/g, '$1^{\\circ}C')
        .replace(/(\d+)\s*%/g, '$1\\ \%')

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
    const specialChars = ['\', '&', '%', '$', '#', '_', '{', '}', '~', '^'];
    let escaped = content;
    specialChars.forEach(char => {
        escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
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
        // Fractions simples (a/b)
        .replace(/(\d+)\s*\/\s*(\d+)/g, '\\frac{$1}{$2}')
        // Racine carrée
        .replace(/√(\d+)/g, '\\sqrt{$1}')
        // Puissances simples (x^2)
        .replace(/([a-zA-Z])\^(\d+)/g, '$1^{$2}')
        // Indices simples (x_1)
        .replace(/([a-zA-Z])_(\d+)/g, '$1_{$2}');

    return converted;
};

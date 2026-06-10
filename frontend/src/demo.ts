/**
 * Built-in sample dataset for local/demo upload flows. It is
 * deliberately messy — untrimmed / mixed-case headers, missing cells, duplicate
 * rows, inconsistent text casing and an invalid number — so the detection and
 * cleaning features have something real to work on. Loaded through the normal
 * upload flow (no special backend path).
 */
export const DEMO_FILENAME = "klienci-demo.csv";

export const DEMO_CSV = ` Customer ID , Full Name ,e-mail, City ,Total PLN,Notes
1, Anna Kowalska ,anna@example.com,Warszawa,1200,VIP
2,Piotr Nowak,piotr@example.com, kraków ,980,
3,Maria Wiśniewska,,Gdańsk,2450,zaległość
4,Jan Lis,jan@example.com,WARSZAWA,,nowy klient
5,Ewa Zając,ewa@example.com,Wrocław,1750,
5,Ewa Zając,ewa@example.com,Wrocław,1750,
6,Tomasz Mazur,tomasz@example.com,,640,
7, Katarzyna Wójcik,kasia@example.com,Poznań,3120,VIP
8,Marek Kamiński,marek@example.com,kraków,,
9,,grzegorz@example.com,Łódź,890,brak nazwiska
10,Agnieszka Lewandowska,aga@example.com,Warszawa ,2010,
10,Agnieszka Lewandowska,aga@example.com,Warszawa ,2010,
11,Robert Woźniak,robert@example.com,Szczecin,1490,
12,Magdalena Dąbrowska,magda@example.com,Gdynia,abc,błędna kwota
`;

/** Builds a File from the sample CSV so it can flow through the upload handler. */
export function createDemoFile(): File {
  return new File([DEMO_CSV], DEMO_FILENAME, { type: "text/csv" });
}

export interface Question {
    id: number;
    text: string;
    dimension: 'Mind' | 'Energy' | 'Nature' | 'Tactics' | 'Identity';
    direction: 1 | -1; // 1 = First Pole (E, S, T, J, A), -1 = Second Pole (I, N, F, P, T)
}

// Dimensions from PDF:
// 1. Mind: Extraverted (E) vs Introverted (I)
// 2. Energy: Observant (S) vs Intuitive (N) -- NOTE: PDF says S/N (Concreto vs Intuitivo)
// 3. Nature: Thinking (T) vs Feeling (F)
// 4. Tactics: Judging (J) vs Prospecting (P)
// 5. Identity: Assertive (A) vs Turbulent (T)

export const PERSONALITY_QUESTIONS: Question[] = [
    // Page 2
    { id: 1, text: "Mi ricarico stando in mezzo alle persone e facendo attività sociali.", dimension: 'Mind', direction: 1 },
    { id: 2, text: "Quando ho una giornata libera, tendo a cercare qualcosa da fare con altri.", dimension: 'Mind', direction: 1 },
    { id: 3, text: "Mi viene naturale parlare per primo in un gruppo o in una nuova situazione.", dimension: 'Mind', direction: 1 },
    { id: 4, text: "Durante un evento, mi piace passare da una conversazione all'altra.", dimension: 'Mind', direction: 1 },
    { id: 5, text: "Preferisco pensare ad alta voce piuttosto che tenere tutto dentro.", dimension: 'Mind', direction: 1 },
    { id: 6, text: "Le attività di gruppo mi motivano più di quelle da solo.", dimension: 'Mind', direction: 1 },
    { id: 7, text: "Dopo molte interazioni sociali, sento il bisogno di stare da solo per recuperare energie.", dimension: 'Mind', direction: -1 },
    { id: 8, text: "Preferisco conversazioni uno-a-uno piuttosto che gruppi numerosi.", dimension: 'Mind', direction: -1 },
    { id: 9, text: "Di solito rifletto a lungo prima di condividere un'idea in pubblico.", dimension: 'Mind', direction: -1 },
    { id: 10, text: "Mi sento più a mio agio osservando all'inizio, invece di buttarmi subito.", dimension: 'Mind', direction: -1 },
    { id: 11, text: "Quando sono stressato, mi aiuta isolarmi un po' e ridurre i contatti.", dimension: 'Mind', direction: -1 },
    { id: 12, text: "Mi piace avere tempi lunghi di tranquillità durante la giornata.", dimension: 'Mind', direction: -1 },

    { id: 13, text: "Preferisco istruzioni chiare e concrete rispetto a indicazioni vaghe.", dimension: 'Energy', direction: 1 },
    { id: 14, text: "Mi fido più di ciò che vedo e posso verificare che di ipotesi non provate.", dimension: 'Energy', direction: 1 },
    { id: 15, text: "Sono attento ai dettagli pratici (scadenze, numeri, procedure).", dimension: 'Energy', direction: 1 },
    { id: 16, text: "Quando imparo qualcosa, parto dagli esempi reali prima di fare teoria.", dimension: 'Energy', direction: 1 },
    { id: 17, text: "Mi accorgo facilmente di cosa funziona davvero nella pratica quotidiana.", dimension: 'Energy', direction: 1 },
    { id: 18, text: "Preferisco soluzioni semplici e robuste a soluzioni eleganti ma complesse.", dimension: 'Energy', direction: 1 },
    { id: 19, text: "Mi capita di immaginare scenari futuri e possibilità alternative anche senza prove immediate.", dimension: 'Energy', direction: -1 },
    { id: 20, text: "Mi interessano più i significati e i \"perché\" che i dettagli operativi.", dimension: 'Energy', direction: -1 },

    // Page 3
    { id: 21, text: "Spesso colgo schemi e collegamenti tra cose diverse.", dimension: 'Energy', direction: -1 },
    { id: 22, text: "Mi piace sperimentare idee nuove anche se non sono ancora perfezionate.", dimension: 'Energy', direction: -1 },
    { id: 23, text: "Nelle discussioni, tendo a portare metafore o concetti astratti.", dimension: 'Energy', direction: -1 },
    { id: 24, text: "Mi entusiasma più l'innovazione che l'ottimizzazione dell'esistente.", dimension: 'Energy', direction: -1 },

    { id: 25, text: "Quando devo scegliere, cerco prima la soluzione più logica e coerente.", dimension: 'Nature', direction: 1 },
    { id: 26, text: "In un conflitto, preferisco chiarire i fatti anche se può risultare diretto.", dimension: 'Nature', direction: 1 },
    { id: 27, text: "Mi è più facile dare feedback onesto che \"addolcire\" un messaggio.", dimension: 'Nature', direction: 1 },
    { id: 28, text: "Valuto le idee in base alla solidità delle argomentazioni.", dimension: 'Nature', direction: 1 },
    { id: 29, text: "Se una regola è inefficiente, penso sia giusto cambiarla anche se è tradizione.", dimension: 'Nature', direction: 1 },
    { id: 30, text: "Di fronte a un problema, mi concentro su cause e rimedi più che sulle emozioni.", dimension: 'Nature', direction: 1 },
    { id: 31, text: "Mi preoccupa ferire gli altri, quindi scelgo le parole con molta cautela.", dimension: 'Nature', direction: -1 },
    { id: 32, text: "Tendo a decidere considerando soprattutto i valori e l'impatto sulle persone.", dimension: 'Nature', direction: -1 },
    { id: 33, text: "Mi viene naturale mettermi nei panni degli altri prima di giudicare.", dimension: 'Nature', direction: -1 },
    { id: 34, text: "Preferisco trovare un compromesso armonioso piuttosto che vincere una discussione.", dimension: 'Nature', direction: -1 },
    { id: 35, text: "Apprezzo quando le persone sono gentili più che quando hanno ragione.", dimension: 'Nature', direction: -1 },
    { id: 36, text: "Se una decisione è corretta ma dura, mi pesa comunque prenderla.", dimension: 'Nature', direction: -1 },

    { id: 37, text: "Mi piace pianificare in anticipo e rispettare un programma.", dimension: 'Tactics', direction: 1 },
    { id: 38, text: "Preferisco chiudere le cose una volta per tutte, senza lasciarle in sospeso.", dimension: 'Tactics', direction: 1 },
    { id: 39, text: "Mi sento meglio quando ho una lista chiara di priorità.", dimension: 'Tactics', direction: 1 },
    { id: 40, text: "Se devo partire, preparo tutto prima e controllo più volte.", dimension: 'Tactics', direction: 1 },

    // Page 4
    { id: 41, text: "Le scadenze mi aiutano: senza, rischio di rimandare.", dimension: 'Tactics', direction: 1 },
    { id: 42, text: "Trovo rassicurante avere routine e processi definiti.", dimension: 'Tactics', direction: 1 },
    { id: 43, text: "Mi piace tenere aperte le opzioni fino all'ultimo possibile.", dimension: 'Tactics', direction: -1 },
    { id: 44, text: "Lavoro meglio quando posso improvvisare e adattarmi strada facendo.", dimension: 'Tactics', direction: -1 },
    { id: 45, text: "Se arriva un'occasione interessante, cambio piani senza troppi problemi.", dimension: 'Tactics', direction: -1 },
    { id: 46, text: "Preferisco esplorare alternative invece di decidere subito.", dimension: 'Tactics', direction: -1 },
    { id: 47, text: "Mi irrita sentirmi incastrato in regole o procedure troppo rigide.", dimension: 'Tactics', direction: -1 },
    { id: 48, text: "Spesso inizio un progetto anche se non ho ancora tutti i dettagli.", dimension: 'Tactics', direction: -1 },

    { id: 49, text: "Di solito resto calmo anche quando le cose non vanno come previsto.", dimension: 'Identity', direction: 1 },
    { id: 50, text: "Mi fido delle mie capacità e non ho bisogno di continue conferme.", dimension: 'Identity', direction: 1 },
    { id: 51, text: "Se commetto un errore, lo prendo come informazione e vado avanti.", dimension: 'Identity', direction: 1 },
    { id: 52, text: "Sono a mio agio nel prendere decisioni senza ripensarci troppo.", dimension: 'Identity', direction: 1 },
    { id: 53, text: "Quando ricevo critiche, riesco a separare facilmente la mia autostima dal giudizio.", dimension: 'Identity', direction: 1 },
    { id: 54, text: "Mi sento stabile: gli alti e bassi non mi spostano troppo.", dimension: 'Identity', direction: 1 },
    { id: 55, text: "Mi capita di preoccuparmi a lungo per cose che potrebbero andare storte.", dimension: 'Identity', direction: -1 },
    { id: 56, text: "Cerco spesso di migliorarmi perché temo di non essere \"abbastanza\".", dimension: 'Identity', direction: -1 },
    { id: 57, text: "Posso essere molto duro con me stesso dopo un fallimento.", dimension: 'Identity', direction: -1 },
    { id: 58, text: "Mi sento sotto pressione quando penso alle aspettative degli altri.", dimension: 'Identity', direction: -1 },
    { id: 59, text: "Rimugino sulle scelte fatte, pensando a cosa avrei potuto fare meglio.", dimension: 'Identity', direction: -1 },
    { id: 60, text: "Anche se tutto va bene, a volte mi sento comunque inquieto.", dimension: 'Identity', direction: -1 },
];

export const ARCHETYPES: Record<string, { title: string; description: string }> = {
    'INTJ': { title: "Il Progettista", description: "Strategico, indipendente e orientato al miglioramento. Ti piace costruire piani a lungo termine e ottimizzare sistemi. A volte puoi apparire distante o troppo esigente." },
    'INTP': { title: "Il Teorico", description: "Curioso, analitico e amante delle idee. Ti piace capire come funzionano le cose e smontare i concetti fino alle basi. Rischi di rimandare l'azione cercando \"la teoria perfetta\"." },
    'ENTJ': { title: "Il Condottiero", description: "Diretto, ambizioso e focalizzato sui risultati. Ti viene naturale decidere, organizzare e guidare. Attenzione a non schiacciare i tempi o le sensibilità altrui." },
    'ENTP': { title: "L'Innovatore", description: "Creativo, rapido e provocatore costruttivo. Ti entusiasmano le possibilità e i dibattiti intelligenti. Puoi perdere interesse quando la fase diventa solo esecuzione e routine." },
    'INFJ': { title: "Il Consigliere", description: "Intuitivo, profondo e orientato al senso. Leggi bene le persone e cerchi coerenza con i tuoi valori. Rischi di caricarti troppo sulle spalle e di chiuderti se non ti senti capito." },
    'INFP': { title: "L'Idealista", description: "Idealista, autentico e sensibile. Cerchi significato e allineamento con ciò che senti giusto. A volte l'eccesso di introspezione può trasformarsi in indecisione o autosvalutazione." },
    'ENFJ': { title: "Il Mentore", description: "Empatico, motivante e capace di fare squadra. Ti viene naturale far emergere il meglio dagli altri. Occhio a non mettere i bisogni altrui sempre prima dei tuoi." },
    'ENFP': { title: "L'Ispiratore", description: "Energico, ispiratore e orientato alle relazioni. Ami esplorare idee e connessioni umane. Puoi soffrire la ripetitività e saltare tra progetti se manca struttura." },
    'ISTJ': { title: "Il Custode delle Regole", description: "Affidabile, concreto e orientato al dovere. Ti piace chiarezza, regole e responsabilità. In certe situazioni puoi diventare rigido o poco tollerante verso l'improvvisazione." },
    'ISFJ': { title: "Il Protettore", description: "Premuroso, costante e attento ai dettagli delle persone. Ti piace rendere l'ambiente stabile e sicuro. Rischi di trattenere troppo e di dire sì quando vorresti dire no." },
    'ESTJ': { title: "L'Amministratore", description: "Pratico, organizzatore e deciso. Ti piace far funzionare le cose con ordine e standard chiari. A volte puoi sembrare troppo duro o impaziente con chi procede diversamente." },
    'ESFJ': { title: "L'Ospite", description: "Sociale, accogliente e orientato all'armonia. Ti piace creare coesione e prenderti cura del clima del gruppo. Rischi di cercare troppo approvazione o evitare confronti necessari." },
    'ISTP': { title: "Il Tecnico", description: "Calmo, tecnico e orientato alla soluzione. Ti piace intervenire in modo efficace quando c'è un problema concreto. Puoi sembrare distaccato e annoiarti con troppa teoria o burocrazia." },
    'ISFP': { title: "L'Artista", description: "Sensibile, estetico e spontaneo. Ti piace vivere esperienze autentiche e creare bellezza. Rischi di evitare conflitti e di rimandare decisioni strutturali." },
    'ESTP': { title: "Il Dinamico", description: "Dinamico, pratico e amante dell'azione. Ti piace muoverti sul momento e cogliere opportunità. A volte puoi sottovalutare conseguenze a lungo termine o annoiarti con la pianificazione." },
    'ESFP': { title: "L'Animatore", description: "Espressivo, caloroso e orientato al presente. Ti piace intrattenere, condividere e rendere l'esperienza viva. Rischi di disperdere energie se manca una direzione chiara." },
};

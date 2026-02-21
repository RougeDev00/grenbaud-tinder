import React from 'react';

interface TermsModalProps {
    onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
    return (
        <div className="intent-modal-overlay" onClick={onClose}>
            <div className="intent-modal" style={{ maxWidth: '600px', textAlign: 'left', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Termini e Condizioni</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>1. La Nostra Missione 💜</h3>
                        <p>
                            <strong>Baudr</strong> è un progetto nato dal cuore di <strong>GrenBaud</strong> e sviluppato interamente con l'ausilio dell'Intelligenza Artificiale.
                            Non è solo un'app, ma un tentativo sincero di creare un <strong>porto sicuro</strong> nel mare di internet.
                        </p>
                        <p>
                            Vogliamo offrire uno spazio sereno a chiunque si senta solo o sia semplicemente alla ricerca di nuove amicizie.
                            Qui la priorità è la connessione umana autentica, il rispetto e la gentilezza.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>2. Natura del Prodotto</h3>
                        <p>
                            Questa applicazione è un esperimento sociale e tecnologico. Essendo sviluppata mediante IA, potrebbe contenere imperfezioni o bug.
                            Utilizzando Baudr, accetti di far parte di questa fase sperimentale e di contribuire con il tuo feedback a migliorarla.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>3. Codice di Condotta</h3>
                        <p>Per mantenere questo spazio sicuro, ti chiediamo di rispettare poche ma fondamentali regole:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Sii gentile e rispettoso verso tutti.</li>
                            <li>È vietato qualsiasi forma di bullismo, molestia o incitamento all'odio.</li>
                            <li>Non condividere contenuti sessualmente espliciti o illegali.</li>
                            <li>Rispetta la privacy altrui: ciò che viene detto in confidenza, resta in confidenza.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>4. Limitazione di Responsabilità</h3>
                        <p>
                            GrenBaud e il team di sviluppo non sono responsabili per le azioni degli utenti, né online né offline.
                            Baudr funge solo da facilitatore di incontri virtuali. Ti invitiamo a usare sempre il buon senso e la cautela quando interagisci con sconosciuti o decidi di incontrarli dal vivo.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>5. Privacy e Dati</h3>
                        <p>
                            L'accesso avviene tramite Twitch per verificare la tua identità nella community.
                            Non vendiamo i tuoi dati a terzi. Le informazioni che inserisci nel tuo profilo servono esclusivamente per calcolare le affinità e permetterti di trovare persone simili a te.
                        </p>
                    </section>

                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                        "Siamo qui per unire, non per dividere. Divertiti e fai nuove conoscenze!" — GrenBaud
                    </div>

                </div>

                <div className="intent-modal-actions" style={{ marginTop: '24px' }}>
                    <button className="btn btn-primary" onClick={onClose}>
                        Ho letto e accetto ✨
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;

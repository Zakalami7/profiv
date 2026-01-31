import React, { useState } from 'react';
import type { ExamEvent } from '../types';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (eventData: { id?: number; title: string; date: string; type: 'CONTROLE' }) => void;
  existingEvents: ExamEvent[];
  subject: string;
}

export const PlanningModal: React.FC<PlanningModalProps> = ({ isOpen, onClose, onConfirm, existingEvents, subject }) => {
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTitle, setNewTitle] = useState(`DS ${subject}`);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Filtrer les événements futurs qui sont des contrôles pour pouvoir y rattacher le devoir
  const futureEvents = existingEvents.filter(e => 
      e.type === 'CONTROLE' && 
      new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))
  );

  if (!isOpen) return null;

  const handleSubmit = () => {
      if (mode === 'NEW') {
          if (!newTitle || !newDate) return;
          onConfirm({ title: newTitle, date: newDate, type: 'CONTROLE' });
      } else {
          if (!selectedEventId) return;
          const evt = futureEvents.find(e => e.id.toString() === selectedEventId);
          if (evt) {
              onConfirm({ id: evt.id, title: evt.title, date: evt.date, type: 'CONTROLE' });
          }
      }
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
             <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Joindre le Devoir
             </h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Choix du mode */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                    onClick={() => setMode('NEW')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'NEW' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Nouveau Contrôle
                </button>
                <button 
                    onClick={() => setMode('EXISTING')}
                    disabled={futureEvents.length === 0}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'EXISTING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
                >
                    Contrôle Existant
                </button>
            </div>

            {mode === 'NEW' ? (
                <div className="space-y-4 animate-slide-in">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre du contrôle</label>
                        <input 
                            type="text" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: DS N°1 - Algèbre"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date prévue</label>
                        <input 
                            type="date" 
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-slide-in">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Choisir un contrôle existant</label>
                        <select 
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="">-- Sélectionner --</option>
                            {futureEvents.map(evt => (
                                <option key={evt.id} value={evt.id}>
                                    {evt.date} : {evt.title}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Les exercices générés seront attachés à cet événement dans votre calendrier.
                        </p>
                    </div>
                </div>
            )}

            <button 
                onClick={handleSubmit}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Confirmer
            </button>
        </div>
      </div>
    </div>
  );
};
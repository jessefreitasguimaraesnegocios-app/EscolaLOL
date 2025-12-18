import React, { useState } from 'react';
import { Student, Language } from '../types';
import { User, Camera, Phone, CreditCard, FileText, Save, X, MapPin } from 'lucide-react';
import { t } from '../services/i18n';

interface StudentProfileProps {
  student: Student;
  onUpdate: (updates: Partial<Student>) => void;
  lang: Language;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ student, onUpdate, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [photo, setPhoto] = useState(student.photo || '');
  const [notes, setNotes] = useState(student.notes || '');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhoto(result);
        onUpdate({ photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate({ photo, notes });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPhoto(student.photo || '');
    setNotes(student.notes || '');
    setIsEditing(false);
  };

  return (
    <div className="h-full bg-hextech-black overflow-y-auto">
      <div className="bg-hextech-dark border-b border-hextech-gold/30 p-6">
        <h2 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase">
          {t('profile', lang) || 'Meu Perfil'}
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Photo Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-hextech-gold bg-hextech-dark flex items-center justify-center overflow-hidden">
              {photo ? (
                <img src={photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-hextech-gold/50" />
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-hextech-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-hextech-lightGold transition-all border-2 border-hextech-black">
                <Camera size={20} className="text-hextech-black" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {isEditing && (
            <p className="mt-2 text-xs text-hextech-gray/60 text-center">
              Clique no ícone da câmera para alterar a foto
            </p>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <div className="bg-hextech-dark border border-hextech-gold/20 p-4">
            <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2">
              {t('name', lang)}
            </label>
            <div className="text-white font-spiegel">{student.name}</div>
            <p className="text-xs text-hextech-gray/60 mt-1">Não pode ser alterado</p>
          </div>

          <div className="bg-hextech-dark border border-hextech-gold/20 p-4">
            <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <Phone size={14} />
              {t('phone', lang)}
            </label>
            <div className="text-white font-spiegel">{student.phone}</div>
            <p className="text-xs text-hextech-gray/60 mt-1">Não pode ser alterado</p>
          </div>

          <div className="bg-hextech-dark border border-hextech-gold/20 p-4">
            <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <CreditCard size={14} />
              CPF
            </label>
            <div className="text-white font-spiegel">{student.cpf}</div>
            <p className="text-xs text-hextech-gray/60 mt-1">Não pode ser alterado</p>
          </div>

          <div className="bg-hextech-dark border border-hextech-gold/20 p-4">
            <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <MapPin size={14} />
              {t('address', lang)}
            </label>
            <div className="text-white font-spiegel">{student.address}</div>
            <p className="text-xs text-hextech-gray/60 mt-1">Não pode ser alterado</p>
          </div>

          {/* Notes Section - Editable */}
          <div className="bg-hextech-dark border border-hextech-gold/20 p-4">
            <label className="block text-hextech-gold font-beaufort text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <FileText size={14} />
              Observações
            </label>
            {isEditing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Autista, precisa de atenção especial, alergias, etc."
                className="w-full bg-hextech-black border border-hextech-gold/30 px-4 py-3 text-white placeholder-hextech-gray/50 focus:outline-none focus:border-hextech-gold focus:shadow-[0_0_15px_rgba(195,167,88,0.2)] transition-all min-h-[100px] resize-none"
              />
            ) : (
              <div className="text-white font-spiegel min-h-[60px]">
                {notes || <span className="text-hextech-gray/50 italic">Nenhuma observação</span>}
              </div>
            )}
            <p className="text-xs text-hextech-gray/60 mt-1">
              Informe condições especiais, alergias, necessidades, etc.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 bg-hextech-dark border border-hextech-gold/30 text-hextech-gold py-3 font-beaufort text-sm uppercase tracking-widest hover:border-hextech-gold transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 hextech-button-primary py-3 text-sm font-beaufort uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Save size={16} /> Salvar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full hextech-button-primary py-3 text-sm font-beaufort uppercase tracking-widest"
            >
              Editar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;


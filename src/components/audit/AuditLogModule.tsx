import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, User, Activity, RefreshCw } from 'lucide-react';
import { AuditLog } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface AuditLogModuleProps {
  auditLogs?: AuditLog[]; // Conservé pour la compatibilité des props
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = () => {
  const { language } = useLanguage();
  const [liveLogs, setLiveLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        userName: log.user_name || log.userEmail || 'Mehdi Ouhssain',
        userRole: log.user_role || log.userRole || 'Admin',
        action: log.action || 'INSERT',
        module: log.target_module || log.module || 'System',
        details: log.details || '',
      })) as AuditLog[];

      setLiveLogs(mapped);
    } catch (error) {
      console.error("Erreur lors du chargement des journaux d'audit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (isLoading && liveLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#D4A017] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="font-bold tracking-widest uppercase text-sm">
          {language === 'fr' ? 'Chargement du journal d\'audit...' : 'Loading audit trail...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-[#F4F4F2] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#D4A017]" /> 
          {language === 'fr' ? 'Journal d’Audit de Sécurité & Système' : 'Security & System Audit Trail'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {language === 'fr'
            ? 'Suivi complet de la conformité des enregistrements professionnels créés, modifiés, supprimés et exportés.'
            : 'Full compliance log tracking created, edited, deleted, and exported business records.'}
        </p>
      </div>

      <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden shadow-xl">
        {/* Conteneur avec scroll horizontal */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          {/* Table avec largeur minimale */}
          <table className="w-full text-left text-xs text-[#F4F4F2] min-w-[800px]">
            <thead className="bg-[#222222] border-b border-[#2D2D2D] text-zinc-400 font-bold uppercase">
              <tr>
                <th className="p-4">{language === 'fr' ? 'Horodatage' : 'Timestamp'}</th>
                <th className="p-4">{language === 'fr' ? 'Utilisateur' : 'User'}</th>
                <th className="p-4">{language === 'fr' ? 'Action' : 'Action'}</th>
                <th className="p-4">{language === 'fr' ? 'Module Cible' : 'Module Target'}</th>
                <th className="p-4">{language === 'fr' ? 'Détails' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {liveLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    {language === 'fr' ? 'Aucun enregistrement d\'audit dans le cloud.' : 'No audit records found in the cloud.'}
                  </td>
                </tr>
              ) : (
                liveLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#252525] transition-colors">
                    <td className="p-4 font-mono text-zinc-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 font-bold text-[#D4A017]">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="p-4 font-bold text-sky-400">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        log.action === 'INSERT' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        log.action === 'DELETE' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                        'bg-sky-950 text-sky-400 border-sky-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-zinc-300">{log.module}</td>
                    <td className="p-4 text-zinc-300">{log.details || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogModule;
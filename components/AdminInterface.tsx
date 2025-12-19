import React, { useState } from 'react';
import { Vehicle, Student, VehicleStatus, Language } from '../types';
import MapEngine from './MapEngine';
import { generateFleetReport } from '../services/geminiService';
import { BarChart, Activity, Sparkles, LayoutDashboard, Users, Bus as BusIcon, Truck, Settings, X, Save, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { t, translateStatus, translateStudentStatus } from '../services/i18n';

interface AdminInterfaceProps {
  vehicles: Vehicle[];
  students: Student[];
  onUpdateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  lang: Language;
  onLogout?: () => void;
}

const AdminInterface: React.FC<AdminInterfaceProps> = ({ vehicles, students, onUpdateVehicle, lang, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MAP' | 'FLEET' | 'STUDENTS'>('DASHBOARD');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const chartData = [
    { name: t('on_time', lang), value: vehicles.filter(v => v.status === 'EN_ROUTE').length, color: '#1F4E8C' },
    { name: t('delayed', lang), value: vehicles.filter(v => v.status === 'DELAYED').length, color: '#ef4444' },
    { name: t('idle', lang), value: vehicles.filter(v => v.status === 'IDLE').length, color: '#C3A758' },
  ];

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    const report = await generateFleetReport(vehicles, lang);
    setAiReport(report);
    setLoadingAi(false);
  };

  return (
    <div className="flex h-screen bg-hextech-black overflow-hidden font-spiegel">
      {/* Hextech Sidebar */}
      <aside className="w-64 bg-hextech-dark border-r border-hextech-gold/30 flex flex-col hidden md:flex shadow-2xl z-30">
        <div className="p-8 border-b border-hextech-gold/20">
          <h1 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-[0.2em] uppercase title-glow">SchoolPool</h1>
          <div className="h-px w-full bg-gradient-to-r from-hextech-gold/40 to-transparent mt-2"></div>
        </div>
        
        <nav className="flex-1 p-4 space-y-4 mt-4">
          {[
            { id: 'DASHBOARD', icon: LayoutDashboard, label: 'dashboard' },
            { id: 'MAP', icon: BarChart, label: 'live_map' },
            { id: 'FLEET', icon: Truck, label: 'fleet' },
            { id: 'STUDENTS', icon: Users, label: 'students' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 border transition-all font-beaufort text-xs tracking-hextech uppercase
                ${activeTab === tab.id ? 'bg-hextech-blue border-hextech-buttonBlue text-white shadow-[0_0_15px_rgba(31,78,140,0.4)]' : 'border-transparent text-hextech-gold/60 hover:text-hextech-gold hover:border-hextech-gold/20 hover:bg-white/5'}`}>
              <tab.icon size={18} />
              <span>{t(tab.label as any, lang)}</span>
            </button>
          ))}
          
          {/* Logout Button */}
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3 border border-red-500/30 text-red-500/60 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all font-beaufort text-xs tracking-hextech uppercase mt-8">
              <LogOut size={18} />
              <span>{t('logout', lang) || 'Sair'}</span>
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-hextech-gold/10 bg-black/20">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-hextech-gold flex items-center justify-center bg-hextech-black text-hextech-gold font-beaufort font-bold">DS</div>
              <div>
                <div className="text-[10px] font-beaufort text-hextech-gold tracking-widest opacity-60 uppercase">Admin</div>
                <div className="text-xs font-bold text-white tracking-wider">DIRECTOR SMITH</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-hextech-blue/10 to-transparent pointer-events-none"></div>

        {activeTab === 'DASHBOARD' && (
          <div className="p-8 overflow-y-auto h-full space-y-8 relative z-10">
            <header className="mb-8">
               <h2 className="text-3xl font-beaufort font-bold text-hextech-gold tracking-[0.15em] uppercase">{t('overview', lang)}</h2>
               <div className="h-1 w-20 bg-hextech-gold mt-2 shadow-[0_0_10px_rgba(195,167,88,0.5)]"></div>
            </header>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-hextech-dark/60 border border-hextech-gold/20 p-6 shadow-inner">
                <div className="text-[10px] font-beaufort text-hextech-gold uppercase tracking-[0.2em] mb-4 opacity-70">{t('active_vehicles', lang)}</div>
                <div className="text-5xl font-beaufort font-bold text-white tracking-widest">{vehicles.filter(v => v.status === 'EN_ROUTE').length}</div>
              </div>
              <div className="bg-hextech-dark/60 border border-hextech-gold/20 p-6 shadow-inner">
                <div className="text-[10px] font-beaufort text-hextech-gold uppercase tracking-[0.2em] mb-4 opacity-70">{t('students_picked_up', lang)}</div>
                <div className="text-5xl font-beaufort font-bold text-white tracking-widest">
                  {students.filter(s => s.status === 'PICKED_UP').length}<span className="text-xl text-hextech-gold/40">/{students.length}</span>
                </div>
              </div>
              <div className="bg-hextech-dark/60 border border-hextech-gold/20 p-6 shadow-inner flex items-center justify-between overflow-hidden">
                <div className="w-20 h-20">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={chartData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value">{chartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex-1 ml-4">
                  <div className="text-[10px] font-beaufort text-hextech-gold uppercase tracking-[0.2em] mb-2">{t('fleet_status', lang)}</div>
                  <div className="space-y-1">
                    {chartData.map(d => (
                      <div key={d.name} className="flex items-center gap-2 text-[10px] text-hextech-gray uppercase tracking-widest font-bold">
                        <div className="w-1.5 h-1.5" style={{backgroundColor: d.color}}></div> {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI ANALYST - LoL STYLE NOTIFICATION/QUEST */}
            <section className="bg-hextech-dark border border-hextech-gold/40 p-1">
               <div className="border border-hextech-gold/10 p-8 bg-gradient-to-br from-hextech-blue/10 via-transparent to-hextech-gold/5 relative overflow-hidden">
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="p-4 border border-hextech-gold/50 bg-hextech-black shadow-[0_0_20px_rgba(195,167,88,0.2)]">
                      <Sparkles className="text-hextech-gold" size={40} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase mb-2">{t('ai_analyst', lang)}</h3>
                      <p className="text-hextech-gray font-spiegel text-sm mb-6 leading-relaxed opacity-80 uppercase tracking-widest max-w-2xl">{t('ai_desc', lang)}</p>
                      
                      {!aiReport ? (
                        <button 
                          onClick={handleGenerateReport}
                          disabled={loadingAi}
                          className="hextech-button-secondary px-8 py-3 text-xs font-bold">
                          {loadingAi ? t('analyzing', lang) : t('generate_report', lang)}
                        </button>
                      ) : (
                        <div className="bg-hextech-black/60 border border-hextech-gold/30 p-6 animate-fade-in font-spiegel">
                           <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-beaufort text-hextech-gold tracking-widest uppercase">{t('analysis_result', lang)}</span>
                              <button onClick={() => setAiReport(null)} className="text-xs text-red-500 font-bold tracking-widest hover:underline">{t('clear_report', lang)}</button>
                           </div>
                           <div className="text-hextech-gray text-sm leading-relaxed uppercase tracking-wider whitespace-pre-line border-l-2 border-hextech-gold pl-4">
                             {aiReport}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Hextech Decorative BG SVG */}
                  <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none transform rotate-12">
                     <BusIcon size={200} className="text-hextech-gold" />
                  </div>
               </div>
            </section>

            {/* LIVE ACTIVITY */}
            <div className="space-y-4 pb-12">
               <h3 className="text-xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase border-b border-hextech-gold/20 pb-2">{t('live_activity', lang)}</h3>
               <div className="grid grid-cols-1 gap-2">
                 {vehicles.map(v => (
                   <div key={v.id} className="bg-hextech-dark/40 border border-hextech-gold/10 p-4 flex items-center justify-between hover:bg-hextech-gold/5 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-2 h-2 rounded-full ${v.status === 'DELAYED' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-hextech-blue shadow-[0_0_10px_#1F4E8C]'}`}></div>
                         <div>
                            <div className="text-xs font-beaufort font-bold text-white tracking-widest uppercase">{v.plateNumber} <span className="text-hextech-gold/50 ml-2 font-normal">| {v.driverName}</span></div>
                            <div className="text-[10px] text-hextech-gray/60 uppercase tracking-widest mt-1">{t('destination', lang)}: {v.destinationSchool}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${v.status === 'DELAYED' ? 'text-red-500' : 'text-hextech-blue'}`}>
                           {translateStatus(v.status, lang)}
                         </div>
                         <div className="text-[10px] text-hextech-gray/40 font-bold uppercase mt-1 tracking-widest">{v.nextStopEta} MIN</div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'MAP' && (
           <div className="h-full w-full relative">
              <MapEngine vehicles={vehicles} students={students} showRoutes={true} className="h-full w-full opacity-60" />
              <div className="absolute top-8 left-8 bg-hextech-dark/90 border border-hextech-gold/50 p-6 shadow-2xl max-w-sm">
                <h3 className="text-lg font-beaufort font-bold text-hextech-gold tracking-hextech uppercase mb-2">{t('live_tracking', lang)}</h3>
                <div className="h-0.5 w-12 bg-hextech-gold mb-3"></div>
                <p className="text-xs text-hextech-gray uppercase tracking-widest leading-relaxed opacity-70">{t('tracking_desc', lang)}</p>
              </div>
           </div>
        )}

        {/* Fleet & Students follow similar pattern with LoL tables/cards */}
        {(activeTab === 'FLEET' || activeTab === 'STUDENTS') && (
           <div className="p-8 h-full overflow-y-auto">
              <header className="mb-8">
                 <h2 className="text-3xl font-beaufort font-bold text-hextech-gold tracking-hextech uppercase">{t(activeTab === 'FLEET' ? 'fleet_management' : 'student_registry', lang)}</h2>
                 <div className="h-1 w-20 bg-hextech-gold mt-2"></div>
              </header>
              <div className="bg-hextech-dark/40 border border-hextech-gold/20 overflow-hidden shadow-2xl">
                 <table className="w-full text-left font-spiegel">
                    <thead className="bg-hextech-black border-b border-hextech-gold/30">
                       <tr>
                          <th className="p-5 text-[10px] font-beaufort text-hextech-gold tracking-[0.2em] uppercase">Info</th>
                          <th className="p-5 text-[10px] font-beaufort text-hextech-gold tracking-[0.2em] uppercase">{t('status', lang)}</th>
                       </tr>
                    </thead>
                    <tbody>
                       {(activeTab === 'FLEET' ? vehicles : students).map((item: any) => (
                          <tr key={item.id} className="border-b border-hextech-gold/5 hover:bg-white/5 transition-all">
                             <td className="p-5">
                                <div className="text-sm font-bold text-white tracking-widest uppercase">{activeTab === 'FLEET' ? item.plateNumber : item.name}</div>
                                <div className="text-[10px] text-hextech-gray/50 uppercase tracking-widest">{activeTab === 'FLEET' ? item.driverName : item.address}</div>
                             </td>
                             <td className="p-5">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${item.status === 'DELAYED' || item.status === 'ABSENT' ? 'border-red-900 text-red-500 bg-red-950/20' : 'border-hextech-blue/30 text-hextech-blue bg-hextech-blue/5'}`}>
                                   {activeTab === 'FLEET' ? translateStatus(item.status, lang) : translateStudentStatus(item.status, lang)}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminInterface;
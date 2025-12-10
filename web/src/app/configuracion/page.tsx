'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Bell, FileText, Plus, Edit2, Trash2, Send,
  Mail, MessageSquare, RefreshCw, CheckCircle, XCircle,
  AlertCircle, Calendar, Activity, Clock, User, Settings,
  Download, Eye
} from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  notify_email: boolean;
  notify_whatsapp: boolean;
  is_active: boolean;
  created_at: string;
  last_activity?: string;
  records_today?: number;
}

interface DailyReport {
  id: string;
  report_date: string;
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_growth_records: number;
  total_photos: number;
  total_lab_analyses: number;
  alerts_generated: number;
  sent_to_admin: boolean;
  sent_at?: string;
}

interface InactiveUser {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  notify_email: boolean;
  notify_whatsapp: boolean;
  last_active?: string;
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'notificaciones' | 'reportes'>('usuarios');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for user
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role: 'field_engineer',
    phone: '',
    notify_email: true,
    notify_whatsapp: false
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?include_activity=true');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchInactiveUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?type=inactive');
      const data = await res.json();
      if (data.success) {
        setInactiveUsers(data.inactive_users || []);
      }
    } catch (error) {
      console.error('Error fetching inactive users:', error);
    }
  }, []);

  const fetchTodayReport = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?type=daily_report');
      const data = await res.json();
      if (data.success) {
        setTodayReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchInactiveUsers(), fetchTodayReport()])
      .finally(() => setLoading(false));
  }, [fetchUsers, fetchInactiveUsers, fetchTodayReport]);

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser
        ? { ...userForm, user_id: editingUser.id }
        : userForm;

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: editingUser ? 'Usuario actualizado' : 'Usuario creado' });
        setShowUserModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar usuario' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Usuario desactivado' });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al desactivar usuario' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reminders' })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchInactiveUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al enviar recordatorios' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendAdminReport = async () => {
    try {
      setSendingReport(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_admin_report' })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Reporte enviado al administrador' });
        fetchTodayReport();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al enviar reporte' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSendingReport(false);
    }
  };

  const resetForm = () => {
    setUserForm({
      email: '',
      full_name: '',
      role: 'field_engineer',
      phone: '',
      notify_email: true,
      notify_whatsapp: false
    });
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
      notify_email: user.notify_email,
      notify_whatsapp: user.notify_whatsapp
    });
    setShowUserModal(true);
  };

  const openNewModal = () => {
    setEditingUser(null);
    resetForm();
    setShowUserModal(true);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'reportes', label: 'Reportes', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
          </div>
          <p className="text-gray-600">Gestiona usuarios, notificaciones y reportes del sistema</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Usuarios */}
            {activeTab === 'usuarios' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                  <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Usuario
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay usuarios registrados</p>
                    <button
                      onClick={openNewModal}
                      className="mt-4 text-green-600 hover:underline"
                    >
                      Agregar el primer usuario
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuario</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rol</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Notificaciones</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actividad Hoy</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{user.full_name}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : user.role === 'supervisor'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {user.role === 'admin' ? 'Admin' :
                                 user.role === 'supervisor' ? 'Supervisor' : 'Ingeniero'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {user.notify_email && (
                                  <span className="flex items-center gap-1 text-xs text-gray-600">
                                    <Mail className="w-4 h-4" /> Email
                                  </span>
                                )}
                                {user.notify_whatsapp && (
                                  <span className="flex items-center gap-1 text-xs text-gray-600">
                                    <MessageSquare className="w-4 h-4" /> WhatsApp
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span className={`font-medium ${
                                  (user.records_today || 0) > 0 ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                  {user.records_today || 0} registros
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {user.is_active ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" /> Activo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" /> Inactivo
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Desactivar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Notificaciones */}
            {activeTab === 'notificaciones' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Usuarios Inactivos Hoy</h2>
                  <button
                    onClick={handleSendReminders}
                    disabled={sendingReminders || inactiveUsers.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      sendingReminders || inactiveUsers.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {sendingReminders ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    Enviar Recordatorios
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Sistema de Recordatorios</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Los recordatorios se envían automáticamente de Lunes a Viernes a las 6:00 PM
                        a los usuarios que no hayan subido información durante el día.
                      </p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                  </div>
                ) : inactiveUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium text-green-600">¡Todos los usuarios han subido información hoy!</p>
                    <p className="text-sm mt-2">No hay usuarios inactivos que notificar</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inactiveUsers.map(user => (
                      <div key={user.user_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.phone && (
                              <p className="text-sm text-gray-500">{user.phone}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {user.notify_email && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                                  <Mail className="w-3 h-3" /> Email
                                </span>
                              )}
                              {user.notify_whatsapp && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs">
                                  <MessageSquare className="w-3 h-3" /> WhatsApp
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reportes */}
            {activeTab === 'reportes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Reporte Diario</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchTodayReport}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Actualizar
                    </button>
                    <button
                      onClick={handleSendAdminReport}
                      disabled={sendingReport}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        sendingReport
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {sendingReport ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Enviar a Admin
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Reporte Automático</p>
                      <p className="text-sm text-blue-700 mt-1">
                        El reporte diario se genera y envía automáticamente al administrador
                        todos los días a las 8:00 PM con el resumen de actividades.
                      </p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                  </div>
                ) : !todayReport ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay reporte generado para hoy</p>
                    <button
                      onClick={fetchTodayReport}
                      className="mt-4 text-blue-600 hover:underline"
                    >
                      Generar reporte
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Report Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Reporte del {new Date(todayReport.report_date).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        {todayReport.sent_to_admin && (
                          <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle className="w-4 h-4" />
                            Enviado al admin {todayReport.sent_at && `el ${new Date(todayReport.sent_at).toLocaleString('es-MX')}`}
                          </p>
                        )}
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Download className="w-5 h-5" />
                        Descargar PDF
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <Users className="w-5 h-5" />
                          <span className="text-sm">Total Usuarios</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{todayReport.total_users}</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Activos Hoy</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{todayReport.active_users}</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm">Inactivos</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{todayReport.inactive_users}</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-sm">Alertas</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{todayReport.alerts_generated}</p>
                      </div>
                    </div>

                    {/* Activity Summary */}
                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Resumen de Actividad
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">{todayReport.total_growth_records}</p>
                          <p className="text-sm text-green-700 mt-1">Registros de Crecimiento</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{todayReport.total_photos}</p>
                          <p className="text-sm text-blue-700 mt-1">Fotos Subidas</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-3xl font-bold text-purple-600">{todayReport.total_lab_analyses}</p>
                          <p className="text-sm text-purple-700 mt-1">Análisis de Lab</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for User Form */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Juan Pérez García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: juan@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: +52 1 33 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="field_engineer">Ingeniero de Campo</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Preferencias de Notificación</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.notify_email}
                        onChange={e => setUserForm({ ...userForm, notify_email: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Notificar por Email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userForm.notify_whatsapp}
                        onChange={e => setUserForm({ ...userForm, notify_whatsapp: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Notificar por WhatsApp</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={!userForm.full_name || !userForm.email}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    !userForm.full_name || !userForm.email
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

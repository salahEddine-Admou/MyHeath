import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminOverview,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  getAdminSubscriptions,
  assignAdminSubscription,
  updateAdminSubscription,
  cancelAdminSubscription,
} from '../services/adminService';

const TABS = ['Overview', 'Users', 'Subscriptions', 'Plans'];
const emptyUser = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'patient',
  gender: 'woman',
  phone: '',
  specialty: '',
  hasDiabetes: false,
  diabetesType: 'type2',
  assignedDoctor: '',
  isActive: true,
};
const emptyPlan = {
  code: '',
  name: '',
  description: '',
  price: 0,
  currency: 'MAD',
  interval: 'monthly',
  features: '',
  includesAiCoach: false,
  includesPriorityChat: false,
  maxAiMessages: 30,
  isActive: true,
  sortOrder: 0,
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab = TABS.includes(tabParam) ? tabParam : 'Overview';
  const setTab = (next) => {
    setParams(next === 'Overview' ? {} : { tab: next });
  };
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [subForm, setSubForm] = useState({
    userId: '',
    planId: '',
    status: 'active',
    notes: '',
    autoRenew: true,
  });

  const doctors = users.filter((u) => u.role === 'doctor' && u.isActive);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const [ov, us, pl, su] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(true),
        getAdminPlans(),
        getAdminSubscriptions(),
      ]);
      setOverview(ov.data);
      setUsers(us.data.users || []);
      setPlans(pl.data.plans || []);
      setSubscriptions(su.data.subscriptions || []);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const startEditUser = (u) => {
    setEditingUserId(u._id);
    setUserForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: '',
      role: u.role || 'patient',
      gender: u.gender || 'woman',
      phone: u.phone || '',
      specialty: u.specialty || '',
      hasDiabetes: Boolean(u.hasDiabetes),
      diabetesType: u.diabetesType || 'type2',
      assignedDoctor: u.assignedDoctor?._id || u.assignedDoctor || '',
      isActive: u.isActive !== false,
    });
    setTab('Users');
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...userForm,
        assignedDoctor: userForm.assignedDoctor || null,
        password: userForm.password || undefined,
      };
      if (editingUserId) {
        await updateAdminUser(editingUserId, payload);
        flash('User updated');
      } else {
        if (!userForm.password || userForm.password.length < 6) {
          flash('Password must be at least 6 characters');
          return;
        }
        await createAdminUser(payload);
        flash('User created');
      }
      setUserForm(emptyUser);
      setEditingUserId(null);
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'User save failed');
    }
  };

  const deactivateUser = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await deleteAdminUser(id);
      flash('User deactivated');
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Deactivate failed');
    }
  };

  const toggleActive = async (u) => {
    try {
      await updateAdminUser(u._id, { isActive: !u.isActive });
      flash(u.isActive ? 'User deactivated' : 'User activated');
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Update failed');
    }
  };

  const savePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planForm,
        price: Number(planForm.price) || 0,
        maxAiMessages: Number(planForm.maxAiMessages) || 0,
        sortOrder: Number(planForm.sortOrder) || 0,
        features: String(planForm.features || '')
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        code: String(planForm.code || '').toUpperCase(),
      };
      if (editingPlanId) {
        await updateAdminPlan(editingPlanId, payload);
        flash('Plan updated');
      } else {
        await createAdminPlan(payload);
        flash('Plan created');
      }
      setPlanForm(emptyPlan);
      setEditingPlanId(null);
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Plan save failed');
    }
  };

  const startEditPlan = (p) => {
    setEditingPlanId(p._id);
    setPlanForm({
      code: p.code || '',
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? 0,
      currency: p.currency || 'MAD',
      interval: p.interval || 'monthly',
      features: (p.features || []).join(', '),
      includesAiCoach: Boolean(p.includesAiCoach),
      includesPriorityChat: Boolean(p.includesPriorityChat),
      maxAiMessages: p.maxAiMessages ?? 30,
      isActive: p.isActive !== false,
      sortOrder: p.sortOrder ?? 0,
    });
    setTab('Plans');
  };

  const removePlan = async (id) => {
    if (!window.confirm('Delete or deactivate this plan?')) return;
    try {
      const { data } = await deleteAdminPlan(id);
      flash(data.message || 'Plan removed');
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Plan delete failed');
    }
  };

  const assignSub = async (e) => {
    e.preventDefault();
    try {
      await assignAdminSubscription(subForm);
      flash('Subscription assigned');
      setSubForm({ userId: '', planId: '', status: 'active', notes: '', autoRenew: true });
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Assign failed');
    }
  };

  const changeSubStatus = async (id, status) => {
    try {
      if (status === 'cancelled') {
        await cancelAdminSubscription(id, 'Cancelled by admin');
      } else {
        await updateAdminSubscription(id, { status });
      }
      flash('Subscription updated');
      await load();
    } catch (err) {
      flash(err.response?.data?.message || 'Update failed');
    }
  };

  const counts = overview?.counts || {};

  const titles = {
    Overview: ['Overview', 'Platform KPIs at a glance'],
    Users: ['Users', 'Create, edit and activate accounts'],
    Subscriptions: ['Subscriptions', 'Assign and cancel memberships'],
    Plans: ['Plans', 'Configure Free, Care and Premium'],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">{titles[tab][0]}</h1>
          <p className="text-ink-500">{titles[tab][1]}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl text-sm bg-white border border-rose-100 text-ink-700 hover:bg-rose-50 shadow-sm"
        >
          Refresh data
        </button>
      </div>

      {msg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 text-sm">
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-ink-500">Loading…</p>
      ) : (
        <>
          {tab === 'Overview' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Users', counts.users, 'from-ink-900 to-ink-700'],
                  ['Active', counts.activeUsers, 'from-emerald-700 to-emerald-600'],
                  ['Patients', counts.patient, 'from-rose-700 to-rose-500'],
                  ['Doctors', counts.doctor, 'from-sky-800 to-sky-600'],
                  ['Admins', counts.admin, 'from-violet-800 to-violet-600'],
                  ['Active subs', counts.activeSubscriptions, 'from-amber-700 to-amber-500'],
                  ['Plans', counts.plans, 'from-ink-800 to-rose-800'],
                  [
                    'Est. MRR',
                    `${overview?.mrr ?? 0} ${overview?.currency || 'MAD'}`,
                    'from-rose-800 to-ink-900',
                  ],
                ].map(([label, value, gradient]) => (
                  <div
                    key={label}
                    className={`rounded-2xl bg-gradient-to-br ${gradient} text-white px-5 py-4 shadow-sm`}
                  >
                    <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
                    <p className="font-display text-2xl mt-1">{value ?? 0}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white border border-rose-100 px-5 py-4 shadow-sm text-sm text-ink-600">
                Diabetes patients: <strong>{counts.diabetes ?? 0}</strong>
                <span className="mx-2 text-ink-300">·</span>
                Women: <strong>{counts.women ?? 0}</strong>
                <span className="mx-2 text-ink-300">·</span>
                Men: <strong>{counts.men ?? 0}</strong>
              </div>
            </div>
          )}

          {tab === 'Users' && (
            <div className="space-y-6">
              <form
                onSubmit={saveUser}
                className="bg-white/80 border border-rose-100 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <h2 className="sm:col-span-2 lg:col-span-3 font-display text-xl text-ink-900">
                  {editingUserId ? 'Edit user' : 'Add user'}
                </h2>
                {[
                  ['firstName', 'First name'],
                  ['lastName', 'Last name'],
                  ['email', 'Email'],
                  ['password', editingUserId ? 'New password (optional)' : 'Password'],
                  ['phone', 'Phone'],
                  ['specialty', 'Specialty (doctors)'],
                ].map(([key, label]) => (
                  <label key={key} className="text-sm text-ink-600">
                    {label}
                    <input
                      className="input mt-1"
                      type={key === 'password' ? 'password' : 'text'}
                      value={userForm[key]}
                      onChange={(e) => setUserForm((f) => ({ ...f, [key]: e.target.value }))}
                      required={['firstName', 'lastName', 'email'].includes(key)}
                    />
                  </label>
                ))}
                <label className="text-sm text-ink-600">
                  Role
                  <select
                    className="input mt-1"
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="text-sm text-ink-600">
                  Gender
                  <select
                    className="input mt-1"
                    value={userForm.gender}
                    onChange={(e) => setUserForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                  </select>
                </label>
                <label className="text-sm text-ink-600">
                  Assigned doctor
                  <select
                    className="input mt-1"
                    value={userForm.assignedDoctor}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, assignedDoctor: e.target.value }))
                    }
                  >
                    <option value="">— None —</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700 mt-6">
                  <input
                    type="checkbox"
                    checked={userForm.hasDiabetes}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, hasDiabetes: e.target.checked }))
                    }
                  />
                  Diabetes tracking
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700 mt-6">
                  <input
                    type="checkbox"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active
                </label>
                <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
                  <button type="submit" className="bg-rose-600 text-white px-4 py-2 rounded-lg">
                    {editingUserId ? 'Save changes' : 'Create user'}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-rose-200"
                      onClick={() => {
                        setEditingUserId(null);
                        setUserForm(emptyUser);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white/80 border border-rose-100 rounded-xl overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-rose-50 text-left text-ink-600">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-rose-50">
                        <td className="px-3 py-2">
                          {u.firstName} {u.lastName}
                          <div className="text-xs text-ink-400 capitalize">
                            {u.gender}
                            {u.hasDiabetes ? ' · diabetes' : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-ink-600">{u.email}</td>
                        <td className="px-3 py-2 capitalize">{u.role}</td>
                        <td className="px-3 py-2">
                          {u.subscription?.plan?.name || '—'}
                          {u.subscription?.plan?.price != null && (
                            <span className="text-xs text-ink-400 block">
                              {u.subscription.plan.price} {u.subscription.plan.currency}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              u.isActive ? 'text-emerald-700' : 'text-ink-400 line-through'
                            }
                          >
                            {u.isActive ? 'Active' : 'Off'}
                          </span>
                        </td>
                        <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            className="text-rose-700 hover:underline"
                            onClick={() => startEditUser(u)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-ink-600 hover:underline"
                            onClick={() => toggleActive(u)}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            className="text-ink-500 hover:underline"
                            onClick={() => {
                              setSubForm((f) => ({
                                ...f,
                                userId: u._id,
                                planId: plans.find((p) => p.isActive)?._id || plans[0]?._id || '',
                              }));
                              setTab('Subscriptions');
                            }}
                          >
                            Sub
                          </button>
                          {u.isActive && (
                            <button
                              type="button"
                              className="text-red-600 hover:underline"
                              onClick={() => deactivateUser(u._id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'Subscriptions' && (
            <div className="space-y-6">
              <form
                onSubmit={assignSub}
                className="bg-white/80 border border-rose-100 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <h2 className="sm:col-span-2 lg:col-span-3 font-display text-xl text-ink-900">
                  Assign / change subscription
                </h2>
                <label className="text-sm text-ink-600">
                  User
                  <select
                    className="input mt-1"
                    required
                    value={subForm.userId}
                    onChange={(e) => setSubForm((f) => ({ ...f, userId: e.target.value }))}
                  >
                    <option value="">Select user…</option>
                    {users
                      .filter((u) => u.isActive)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm text-ink-600">
                  Plan
                  <select
                    className="input mt-1"
                    required
                    value={subForm.planId}
                    onChange={(e) => setSubForm((f) => ({ ...f, planId: e.target.value }))}
                  >
                    <option value="">Select plan…</option>
                    {plans
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {p.price} {p.currency}/{p.interval}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm text-ink-600">
                  Status
                  <select
                    className="input mt-1"
                    value={subForm.status}
                    onChange={(e) => setSubForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="past_due">Past due</option>
                  </select>
                </label>
                <label className="text-sm text-ink-600 sm:col-span-2">
                  Notes
                  <input
                    className="input mt-1"
                    value={subForm.notes}
                    onChange={(e) => setSubForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700 mt-6">
                  <input
                    type="checkbox"
                    checked={subForm.autoRenew}
                    onChange={(e) =>
                      setSubForm((f) => ({ ...f, autoRenew: e.target.checked }))
                    }
                  />
                  Auto-renew
                </label>
                <div className="sm:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-rose-600 text-white px-4 py-2 rounded-lg">
                    Assign subscription
                  </button>
                </div>
              </form>

              <div className="bg-white/80 border border-rose-100 rounded-xl overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-rose-50 text-left text-ink-600">
                    <tr>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s._id} className="border-t border-rose-50">
                        <td className="px-3 py-2">
                          {s.user
                            ? `${s.user.firstName} ${s.user.lastName}`
                            : '—'}
                          <div className="text-xs text-ink-400">{s.user?.email}</div>
                        </td>
                        <td className="px-3 py-2">
                          {s.plan?.name || '—'}
                          <div className="text-xs text-ink-400">
                            {s.plan?.price} {s.plan?.currency}/{s.plan?.interval}
                          </div>
                        </td>
                        <td className="px-3 py-2 capitalize">{s.status}</td>
                        <td className="px-3 py-2 text-ink-600">
                          {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                        </td>
                        <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                          {(s.status === 'active' || s.status === 'trial') && (
                            <button
                              type="button"
                              className="text-red-600 hover:underline"
                              onClick={() => changeSubStatus(s._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          )}
                          {s.status === 'cancelled' && (
                            <button
                              type="button"
                              className="text-emerald-700 hover:underline"
                              onClick={() => changeSubStatus(s._id, 'active')}
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            type="button"
                            className="text-rose-700 hover:underline"
                            onClick={() =>
                              setSubForm({
                                userId: s.user?._id || '',
                                planId: s.plan?._id || '',
                                status: 'active',
                                notes: '',
                                autoRenew: true,
                              })
                            }
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'Plans' && (
            <div className="space-y-6">
              <form
                onSubmit={savePlan}
                className="bg-white/80 border border-rose-100 rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <h2 className="sm:col-span-2 lg:col-span-3 font-display text-xl text-ink-900">
                  {editingPlanId ? 'Edit plan' : 'Create plan'}
                </h2>
                {[
                  ['code', 'Code (e.g. CARE)'],
                  ['name', 'Name'],
                  ['description', 'Description'],
                  ['price', 'Price'],
                  ['currency', 'Currency'],
                  ['maxAiMessages', 'Max AI messages'],
                  ['sortOrder', 'Sort order'],
                ].map(([key, label]) => (
                  <label key={key} className="text-sm text-ink-600">
                    {label}
                    <input
                      className="input mt-1"
                      type={['price', 'maxAiMessages', 'sortOrder'].includes(key) ? 'number' : 'text'}
                      value={planForm[key]}
                      onChange={(e) => setPlanForm((f) => ({ ...f, [key]: e.target.value }))}
                      required={['code', 'name'].includes(key)}
                      disabled={key === 'code' && Boolean(editingPlanId)}
                    />
                  </label>
                ))}
                <label className="text-sm text-ink-600">
                  Interval
                  <select
                    className="input mt-1"
                    value={planForm.interval}
                    onChange={(e) => setPlanForm((f) => ({ ...f, interval: e.target.value }))}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </label>
                <label className="text-sm text-ink-600 sm:col-span-2">
                  Features (comma-separated)
                  <input
                    className="input mt-1"
                    value={planForm.features}
                    onChange={(e) => setPlanForm((f) => ({ ...f, features: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={planForm.includesAiCoach}
                    onChange={(e) =>
                      setPlanForm((f) => ({ ...f, includesAiCoach: e.target.checked }))
                    }
                  />
                  AI Coach
                </label>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={planForm.includesPriorityChat}
                    onChange={(e) =>
                      setPlanForm((f) => ({ ...f, includesPriorityChat: e.target.checked }))
                    }
                  />
                  Priority chat
                </label>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active
                </label>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                  <button type="submit" className="bg-rose-600 text-white px-4 py-2 rounded-lg">
                    {editingPlanId ? 'Save plan' : 'Create plan'}
                  </button>
                  {editingPlanId && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border"
                      onClick={() => {
                        setEditingPlanId(null);
                        setPlanForm(emptyPlan);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="grid md:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <div
                    key={p._id}
                    className={`rounded-xl border p-4 ${
                      p.isActive
                        ? 'bg-white/80 border-rose-100'
                        : 'bg-ink-50/50 border-ink-100 opacity-70'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <p className="font-display text-xl text-ink-900">{p.name}</p>
                        <p className="text-xs uppercase text-ink-400">{p.code}</p>
                      </div>
                      <p className="font-medium text-rose-700">
                        {p.price} {p.currency}
                        <span className="text-xs text-ink-400 block">/{p.interval}</span>
                      </p>
                    </div>
                    <p className="text-sm text-ink-500 mb-3">{p.description}</p>
                    <ul className="text-xs text-ink-600 space-y-1 mb-4">
                      {(p.features || []).map((f) => (
                        <li key={f}>· {f}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2 text-sm">
                      <button
                        type="button"
                        className="text-rose-700 hover:underline"
                        onClick={() => startEditPlan(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => removePlan(p._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

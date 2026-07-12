import { useEffect, useRef, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import AddDepartmentModal from '../components/organization/AddDepartmentModal'
import AddCategoryModal from '../components/organization/AddCategoryModal'
import AddEmployeeModal from '../components/organization/AddEmployeeModal'
import { useAuth } from '../context/AuthContext'
import {
  listAssetCategories,
  listAssetDepartments,
  updateDepartmentStatus,
  createAssetCategory,
  createDepartment,
} from '../api/assets'
import { listUsers, promoteUser } from '../api/auth'
import { ApiError } from '../api/client'
import { downloadCsv, parseCsv } from '../utils/csv'
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Building2,
  Tag,
  UserCircle,
  MoreVertical,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

const tabs = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Categories' },
  { key: 'employees', label: 'Employees' },
]

const ROLES = ['EMPLOYEE', 'DEPT_HEAD', 'ASSET_MANAGER', 'ADMIN']

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-blue-700 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const selectClass =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900/40'

export default function OrganizationSetup() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('departments')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState(null)

  const [departments, setDepartments] = useState([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [departmentsError, setDepartmentsError] = useState(null)

  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)

  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [employeesError, setEmployeesError] = useState(null)

  const loadDepartments = () => {
    setDepartmentsLoading(true)
    setDepartmentsError(null)
    listAssetDepartments(token)
      .then((data) => setDepartments(data.departments))
      .catch((err) => setDepartmentsError(err instanceof ApiError ? err.message : 'Failed to load departments.'))
      .finally(() => setDepartmentsLoading(false))
  }

  const loadCategories = () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    listAssetCategories(token)
      .then((data) => setCategories(data.categories))
      .catch((err) => setCategoriesError(err instanceof ApiError ? err.message : 'Failed to load categories.'))
      .finally(() => setCategoriesLoading(false))
  }

  const loadEmployees = () => {
    setEmployeesLoading(true)
    setEmployeesError(null)
    listUsers(token)
      .then((data) => setEmployees(data.users))
      .catch((err) => setEmployeesError(err instanceof ApiError ? err.message : 'Failed to load employees.'))
      .finally(() => setEmployeesLoading(false))
  }

  useEffect(loadDepartments, [token])
  useEffect(loadCategories, [token])
  useEffect(loadEmployees, [token])

  useEffect(() => {
    setSearch('')
    setImportError(null)
  }, [activeTab])

  const handleToggleDepartment = async (dept) => {
    const nextStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, status: nextStatus } : d)))
    try {
      await updateDepartmentStatus(dept.id, nextStatus, token)
    } catch {
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, status: dept.status } : d)))
    }
  }

  const handleRoleChange = async (employee, role) => {
    const previous = employee.role
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, role } : e)))
    try {
      await promoteUser(employee.id, { role, departmentId: employee.departmentId }, token)
    } catch {
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, role: previous } : e)))
    }
  }

  const handleDepartmentChange = async (employee, departmentId) => {
    const previous = employee.departmentId
    const deptName = departments.find((d) => String(d.id) === departmentId)?.name ?? null
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, departmentId: departmentId || null, departmentName: deptName } : e))
    )
    try {
      await promoteUser(employee.id, { role: employee.role, departmentId: departmentId || null }, token)
    } catch {
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, departmentId: previous } : e)))
    }
  }

  const filteredDepartments = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  const filteredEmployees = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    if (activeTab === 'departments') {
      downloadCsv('departments.csv', filteredDepartments, [
        { label: 'Name', value: (r) => r.name },
        { label: 'Head', value: (r) => r.headName ?? '' },
        { label: 'Parent Department', value: (r) => r.parentName ?? '' },
        { label: 'Status', value: (r) => r.status },
      ])
    } else if (activeTab === 'categories') {
      downloadCsv('categories.csv', filteredCategories, [
        { label: 'Name', value: (r) => r.name },
        { label: 'Assets', value: (r) => r.assetCount ?? 0 },
      ])
    } else {
      downloadCsv('employees.csv', filteredEmployees, [
        { label: 'Name', value: (r) => r.name },
        { label: 'Email', value: (r) => r.email },
        { label: 'Role', value: (r) => r.role },
        { label: 'Department', value: (r) => r.departmentName ?? '' },
        { label: 'Status', value: (r) => r.status },
      ])
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)

    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      setImportError('CSV file has no data rows.')
      return
    }

    const failures = []
    if (activeTab === 'departments') {
      for (const row of rows) {
        const name = row.Name || row.name
        if (!name) continue
        try {
          await createDepartment({ name }, token)
        } catch (err) {
          failures.push(`${name}: ${err instanceof ApiError ? err.message : 'failed'}`)
        }
      }
      loadDepartments()
    } else if (activeTab === 'categories') {
      for (const row of rows) {
        const name = row.Name || row.name
        if (!name) continue
        try {
          await createAssetCategory({ name }, token)
        } catch (err) {
          failures.push(`${name}: ${err instanceof ApiError ? err.message : 'failed'}`)
        }
      }
      loadCategories()
    }

    if (failures.length) setImportError(`Some rows failed: ${failures.join('; ')}`)
  }

  const handleModalCreated = () => {
    setShowAddModal(false)
    if (activeTab === 'departments') loadDepartments()
    if (activeTab === 'categories') loadCategories()
    if (activeTab === 'employees') loadEmployees()
  }

  const addLabel = activeTab === 'departments' ? 'Add Department' : activeTab === 'categories' ? 'Add Category' : 'Add Employee'
  const searchPlaceholder =
    activeTab === 'departments' ? 'Search departments...' : activeTab === 'categories' ? 'Search categories...' : 'Search employees...'

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Organization Setup</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your company structure, departments, and personnel directory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-6 border-b border-slate-200 px-6 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-6 py-4">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
            />
          </div>
          <button
            type="button"
            aria-label="Filter"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal size={17} />
          </button>
          {activeTab !== 'employees' && (
            <button
              type="button"
              onClick={handleImportClick}
              aria-label="Import CSV"
              title="Import from CSV"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Upload size={17} />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <button
            type="button"
            onClick={handleExport}
            aria-label="Export CSV"
            title="Download as CSV"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Download size={17} />
          </button>
        </div>

        {importError && (
          <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {importError}
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Head</th>
                  <th className="px-6 py-3">Parent Dept</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departmentsLoading && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading departments…</td></tr>
                )}
                {!departmentsLoading && departmentsError && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-red-500">{departmentsError}</td></tr>
                )}
                {!departmentsLoading && !departmentsError && filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60">
                          <Building2 size={16} className="text-blue-700 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{dept.headName ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{dept.parentName ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Toggle checked={dept.status === 'ACTIVE'} onChange={() => handleToggleDepartment(dept)} />
                        <span className={dept.status === 'ACTIVE' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                          {dept.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200" aria-label={`Actions for ${dept.name}`}>
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!departmentsLoading && !departmentsError && filteredDepartments.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">No departments match your search.</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredDepartments.length} of {departments.length} departments</p>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Assets</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoriesLoading && (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading categories…</td></tr>
                )}
                {!categoriesLoading && categoriesError && (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-sm text-red-500">{categoriesError}</td></tr>
                )}
                {!categoriesLoading && !categoriesError && filteredCategories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                          <Tag size={16} className="text-violet-700 dark:text-violet-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{cat.assetCount ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200" aria-label={`Actions for ${cat.name}`}>
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!categoriesLoading && !categoriesError && filteredCategories.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">No categories match your search.</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredCategories.length} of {categories.length} categories</p>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employeesLoading && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading employees…</td></tr>
                )}
                {!employeesLoading && employeesError && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-red-500">{employeesError}</td></tr>
                )}
                {!employeesLoading && !employeesError && filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60">
                          <UserCircle size={16} className="text-blue-700 dark:text-blue-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{emp.email}</td>
                    <td className="px-6 py-4">
                      <select value={emp.role} onChange={(e) => handleRoleChange(emp, e.target.value)} className={selectClass}>
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={emp.departmentId ?? ''}
                        onChange={(e) => handleDepartmentChange(emp, e.target.value)}
                        className={selectClass}
                      >
                        <option value="">—</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{emp.status}</td>
                  </tr>
                ))}
                {!employeesLoading && !employeesError && filteredEmployees.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">No employees match your search.</td></tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredEmployees.length} of {employees.length} employees</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60 p-6 dark:border-blue-900/40 dark:bg-blue-950/20 lg:col-span-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 absolute right-6 top-1/2 -translate-y-1/2 dark:bg-slate-800/70">
            <Sparkles size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="max-w-md text-xl font-bold text-blue-800 dark:text-blue-300">Organizational Insight</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Editing a department here also drives the picklist selection in Assets and Allocation modules.
            Ensure naming conventions are consistent across regions for accurate reporting.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-400">QUICK LINK</span>
          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Import Spreadsheet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Need to setup hundreds of entries at once?
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('departments')
              setTimeout(handleImportClick, 0)
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Upload CSV
            <Upload size={14} />
          </button>
        </div>
      </div>

      {showAddModal && activeTab === 'departments' && (
        <AddDepartmentModal
          departments={departments}
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onCreated={handleModalCreated}
        />
      )}
      {showAddModal && activeTab === 'categories' && (
        <AddCategoryModal onClose={() => setShowAddModal(false)} onCreated={handleModalCreated} />
      )}
      {showAddModal && activeTab === 'employees' && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} onCreated={handleModalCreated} />
      )}
    </DashboardLayout>
  )
}

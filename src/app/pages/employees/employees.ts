import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Employee {
  Clave: number;
  Nombre: string;
  direccion: string;
  fechadenacimiento: string;
  sexo: string;
  tipodesangre: string;
}

interface EmployeeFields {
  Nombre: string;
  direccion: string;
  fechadenacimiento: string;
  sexo: string;
  tipodesangre: string;
}

interface EmployeeForm extends EmployeeFields {
  Clave: number;
}

function isEmployee(value: unknown): value is Employee {
  if (typeof value !== 'object' || value === null) return false;
  const employee = value as Record<string, unknown>;
  return typeof employee['Clave'] === 'number'
    && typeof employee['Nombre'] === 'string'
    && typeof employee['direccion'] === 'string'
    && typeof employee['fechadenacimiento'] === 'string'
    && !Number.isNaN(Date.parse(employee['fechadenacimiento']))
    && typeof employee['sexo'] === 'string'
    && typeof employee['tipodesangre'] === 'string';
}

@Component({
  selector: 'app-employees',
  imports: [FormsModule],
  templateUrl: './employees.html',
  styleUrl: './employees.scss'
})
export class EmployeesPage implements OnInit {
  readonly genders = ['Masculino', 'Femenino'];
  readonly bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  private readonly apiUrl = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? '/api/empleados'
    : 'https://miapi-vfom.onrender.com/api/empleados';

  employees: Employee[] = [];
  loading = true;
  saving = false;
  formOpen = false;
  editingEmployee: Employee | null = null;
  employeeForm: EmployeeForm = this.emptyEmployeeFields();
  error = '';
  formError = '';
  success = '';

  ngOnInit(): void {
    void this.load();
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  openCreateForm(): void {
    this.editingEmployee = null;
    this.employeeForm = this.emptyEmployeeFields(Math.max(0, ...this.employees.map((employee) => employee.Clave)) + 1);
    this.formError = '';
    this.success = '';
    this.formOpen = true;
  }

  openEditForm(employee: Employee): void {
    this.editingEmployee = employee;
    this.employeeForm = {
      Clave: employee.Clave,
      Nombre: employee.Nombre,
      direccion: employee.direccion,
      fechadenacimiento: employee.fechadenacimiento.slice(0, 10),
      sexo: employee.sexo,
      tipodesangre: employee.tipodesangre
    };
    this.formError = '';
    this.success = '';
    this.formOpen = true;
  }

  closeForm(): void {
    if (this.saving) return;
    this.formOpen = false;
    this.formError = '';
  }

  async saveEmployee(): Promise<void> {
    this.formError = '';
    this.success = '';
    const payload: EmployeeFields = {
      Nombre: this.employeeForm.Nombre.trim(),
      direccion: this.employeeForm.direccion.trim(),
      fechadenacimiento: this.employeeForm.fechadenacimiento,
      sexo: this.employeeForm.sexo.trim(),
      tipodesangre: this.employeeForm.tipodesangre.trim()
    };

    if (!payload.Nombre || !payload.direccion || !payload.fechadenacimiento || !payload.sexo || !payload.tipodesangre) {
      this.formError = 'Completa todos los campos para guardar el empleado.';
      return;
    }

    if (!this.editingEmployee && (!Number.isInteger(this.employeeForm.Clave) || this.employeeForm.Clave < 1)) {
      this.formError = 'La clave debe ser un número entero mayor que cero.';
      return;
    }

    if (!this.editingEmployee && this.employees.some((employee) => employee.Clave === this.employeeForm.Clave)) {
      this.formError = 'Ya existe un empleado con esa clave.';
      return;
    }

    this.saving = true;
    try {
      const employee = this.editingEmployee;
      const response = await fetch(
        employee ? `${this.apiUrl}/${encodeURIComponent(String(employee.Clave))}` : this.apiUrl,
        {
          method: employee ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            Clave: employee ? employee.Clave : this.employeeForm.Clave
          })
        }
      );
      if (!response.ok) {
        throw new Error(await this.getApiErrorMessage(response, 'guardar el empleado'));
      }

      this.formOpen = false;
      this.success = employee ? 'Empleado actualizado correctamente.' : 'Empleado creado correctamente.';
      await this.load();
    } catch (error) {
      this.formError = error instanceof Error ? error.message : 'No se pudo guardar el empleado.';
    } finally {
      this.saving = false;
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
  }

  private emptyEmployeeFields(Clave = 1): EmployeeForm {
    return { Clave, Nombre: '', direccion: '', fechadenacimiento: '', sexo: '', tipodesangre: '' };
  }

  private async getApiErrorMessage(response: Response, action: string): Promise<string> {
    const body = await response.text();
    if (body) {
      try {
        const result: unknown = JSON.parse(body);
        if (typeof result === 'object' && result !== null) {
          const details = result as Record<string, unknown>;
          if (typeof details['mensaje'] === 'string') return details['mensaje'];
          if (typeof details['error'] === 'string') return details['error'];
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        return body;
      }
    }
    return `La API respondió con el estado ${response.status} al ${action}.`;
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`La API respondió con el estado ${response.status}.`);
      }

      const result: unknown = await response.json();
      if (!Array.isArray(result) || !result.every(isEmployee)) {
        throw new Error('La API devolvió datos de empleados con un formato no válido.');
      }
      this.employees = result;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los empleados.';
    } finally {
      this.loading = false;
    }
  }
}

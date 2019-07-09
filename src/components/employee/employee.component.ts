import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService } from 'src/services/shared/alert.service';
import { EmployeeService } from 'src/services/employee.service';

import { IEmployee } from './employee.interface';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent implements OnDestroy {
  public employees: IEmployee[];
  private network$;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.network$ = this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
      if (status === ConnectionStatus.Offline) {
        console.log('Employee Page: OFFLINE');
        this.employeeService.employeesFromDB().then(empFromDB => {
          this.employees = empFromDB;
        });
      } else {
        console.log('Employee Page: ONLINE');
        this.employeeService.employeesFromAPI().subscribe(empFromAPI => {
          this.employees = empFromAPI;
        });
      }
    });
  }

  selectEmployee(id: string) {
    this.router.navigate(['home/employee', id]);
  }

  deleteEmployee(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.employeeService.delEmployee(id).subscribe(
        () => console.log('Successfully deleted'),
        (err) => console.log('error: ', err)
      );
    }
  }

  ngOnDestroy() {
    this.network$.unsubscribe();
  }
}

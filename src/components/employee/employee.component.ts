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
  private network$: any;
  private searchText: string;
  private searchResults = [];

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
        this.employeeService.employeesFromServer().subscribe(empFromAPI => {
          this.employees = empFromAPI;
        });
      }
    });

    this.searchText = '';
    this.searchResults = [];
  }

  updateSearchResults(ev: any) {
    this.searchText = ev.target.value;
    if (this.searchText === '') {
      this.searchResults = [];
      return;
    }
    this.employeeService.searchEmployee(this.searchText).subscribe(results => {
      this.searchResults = [];
      if (results.length) {
        results.forEach(res => {
          this.searchResults.push(res);
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

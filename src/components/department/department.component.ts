import { Component, OnDestroy } from '@angular/core';

import { DepartmentService } from 'src/services/department.service';

import { IDepartment } from './department.interface';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';
import { AlertService } from 'src/services/shared/alert.service';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss'],
})
export class DepartmentComponent implements OnDestroy {
  private departments: IDepartment[];
  private network$: any;

  constructor(
    private departmentService: DepartmentService,
    private netConnectionService: NetConnectionService,
    private alertService: AlertService) {
    this.network$ = this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
      if (status === ConnectionStatus.Offline) {
        console.log('Department page: OFFLINE');
        this.departmentService.departmentsFromDB().then(depFromDB => {
          this.departments = depFromDB;
        });
      } else {
        console.log('Department page: ONLINE');
        this.departmentService.departmentsFromServer().subscribe(depFromServer => {
          this.departments = depFromServer;
        });
        this.departmentService.mergeServerDB();
      }
    });
  }

  deleteDepartment(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.departmentService.delDepartment(id).subscribe(
        () => {
          console.log('Successfully deleted');
        },
        (err) => console.log('error: ', err)
      );
    }
  }

  ngOnDestroy() {
    this.network$.unsubscribe();
  }
}

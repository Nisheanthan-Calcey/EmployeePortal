import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService } from './shared/connection.service';

@Injectable()
export class EmployeeService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Employees';

    employeeList: Observable<any[]>;

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService) {}

    getEmployees(): Observable<any[]> {
        console.log('isConnected', this.connectionService.isConnected);
        if (this.connectionService.isConnected) {
            const headers = this.headerService.header;
            this.employeeList = this.http.get<any[]>(this.ROOT_URL , { headers });
        }
        return this.employeeList;
    }

    addEmployeesToLocalServer() {

    }
}

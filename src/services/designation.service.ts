import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService } from './shared/connection.service';

@Injectable()
export class DesignationService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Designations?query=%7B%7D';

    designationList: Observable<any[]>;

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService) {}

    getDesignations(): Observable<any[]> {
        console.log('isConnected', this.connectionService.isConnected);
        if (this.connectionService.isConnected) {
            const headers = this.headerService.header;
            this.designationList = this.http.get<any[]>(this.ROOT_URL , { headers });
        }
        return this.designationList;
    }

    addDesignationsToLocalServer() {

    }
}

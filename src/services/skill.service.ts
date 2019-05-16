import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService } from './shared/connection.service';

@Injectable()
export class SkillService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Skills?query=%7B%7D';

    skillList: Observable<any[]>;

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService) {}

    getSkills(): Observable<any[]> {
        console.log('isConnected', this.connectionService.isConnected);
        if (this.connectionService.isConnected) {
            const headers = this.headerService.header;
            this.skillList = this.http.get<any[]>(this.ROOT_URL , { headers });
        }
        return this.skillList;
    }

    addSkillToLocalServer() {

    }
}
import { Component, OnDestroy } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { DesignationService } from 'src/services/designation.service';

import { IDesignation } from './designation.interface';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';
import { share } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
})
export class DesignationComponent implements OnDestroy {
  private designations: IDesignation[];
  private network$: any;
  private searchText: string;
  private searchResults: any[] = [];

  constructor(
    private designationService: DesignationService,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.network$ = this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
      if (status === ConnectionStatus.Offline) {
        console.log('Designation Page: OFFLINE');
        this.designationService.designationsFromDB().then(dbDes => {
          this.designations = dbDes;
        });
      } else {
        console.log('Designation Page: ONLINE');
        this.designationService.mergeServerDB();
        this.designationService.designationsFromServer().subscribe(apiDes => {
          this.designations = apiDes;
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
    this.designationService.searchDesignations(this.searchText).subscribe(results => {
      this.searchResults = [];
      if (results.length) {
        results.forEach(res => {
          this.searchResults.push(res);
        });
      }
    });
  }

  deleteDesignation(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.designationService.delDesignation(id).subscribe(
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

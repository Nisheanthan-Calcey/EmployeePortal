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
  private online: boolean;
  private network$: any;

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

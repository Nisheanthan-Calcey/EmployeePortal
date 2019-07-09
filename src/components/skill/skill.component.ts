import { Component, OnInit, OnDestroy } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { SkillService } from 'src/services/skill.service';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';

import { ISkills } from './skill.interface';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.scss'],
})
export class SkillComponent implements OnDestroy {
  public skills: ISkills[];
  private network$: any;

  constructor(
    private skillService: SkillService,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.network$ = this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
      if (status === ConnectionStatus.Online) {
        console.log('Skills Page: ONLINE');
        this.skillService.mergeServerDB();
        this.skillService.skillsFromServer().subscribe(skillFromAPI => {
          this.skills = skillFromAPI;
        });
      } else {
        console.log('Skills Page: OFFLINE');
        this.skillService.skillsFromDB().then(skillFromDB => {
          this.skills = skillFromDB;
        });
      }
    });
  }

  deleteSkill(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.skillService.delSkill(id).subscribe(
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

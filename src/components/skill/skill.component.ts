import { Component } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { SkillService } from 'src/services/skill.service';

import { ISkills } from './skill.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.scss'],
})
export class SkillComponent {
  public skills: ISkills[];

  constructor(
    private skillService: SkillService,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.netConnectionService.getConnectionState().subscribe(online => {
      if (online) {
        this.skillService.skillsFromAPI().subscribe(skillFromAPI => {
          this.skills = skillFromAPI;
        });
      } else {
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
}

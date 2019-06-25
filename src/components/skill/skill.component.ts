import { Component } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { SkillService } from 'src/services/skill.service';

import { ISkills } from './skill.interface';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.scss'],
})
export class SkillComponent {
  public skills: ISkills[];

  constructor(private skillService: SkillService,
              private alertService: AlertService) {
    this.skills = this.skillService.getSkills();
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

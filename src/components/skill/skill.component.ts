import { Component, OnInit } from '@angular/core';
import { SkillService } from 'src/services/skill.service';

@Component({
  selector: 'app-skill',
  templateUrl: './skill.component.html',
  styleUrls: ['./skill.component.scss'],
})
export class SkillComponent implements OnInit {

  public skills = [];
  errorMsg: any;

  constructor( private skillService: SkillService) { }

  ngOnInit() {
    this.skillService.getSkills()
    .subscribe(data => (Object.values(data)
                          .map(list => this.skills = list),
                          console.log('List of Skills', this.skills)),
              error => (this.errorMsg = error, console.log(error)));
  }

}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProcessComponent } from '../../components/process/process.component';
import { StoryComponent } from '../../components/story/story.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, StoryComponent, ProcessComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-story />
    <app-process />
  `,
})
export class HomePage {}

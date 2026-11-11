import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContactSectionComponent } from '../../components/contact-section/contact-section.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProcessComponent } from '../../components/process/process.component';
import { StoryComponent } from '../../components/story/story.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, StoryComponent, FeaturedProductsComponent, ProcessComponent, ContactSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-story />
    <app-featured-products />
    <app-process />
    <app-contact-section />
  `,
})
export class HomePage {}

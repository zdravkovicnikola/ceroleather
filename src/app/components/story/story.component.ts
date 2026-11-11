import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-story',
  imports: [RevealDirective, ParallaxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './story.component.html',
  styleUrl: './story.component.scss',
})
export class StoryComponent {
  readonly pillars = [
    { title: 'Ručna izrada', text: 'Svaki komad se kroji i šije ručno, jedan po jedan. Bez serijske proizvodnje.' },
    { title: 'Prava koža', text: 'Koža koja vremenom dobija karakter i nosi tragove vaših kilometara.' },
    { title: 'Pažnja na detaljima', text: 'Šavovi, opšivene ivice, rajsferšlusi i kopče — svaki detalj ima svoju funkciju.' },
    { title: 'Vaše mere', text: 'Prsluk se kroji prema vašim merama, a ne prema tabeli standardnih veličina.' },
    { title: 'Individualni dizajn', text: 'Džepovi, kopče, vezivanje, kragna — zajedno biramo detalje koji vas opisuju.' },
  ];
}

import "hello_angular/polyfills";
import { Component, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

/*jshint multistr: true */



var ProductSearchComponent = Component({
  selector: "mikro-product-search",
  template: '\
    <header> \
      <h1 class="h2">Søgefelt</h1> \
    </header> \
    <section class="search-form"> \
        <div class="input-group input-group-lg"> \
          <label for="keywords" class="sr-only">Keywords</label> \
          <input type="text" id="keywords" name="keywords" \
            placeholder="Søg i titler, undertitler og forfattere" \
            class="form-control input-lg" \
            bindon-ngModel="keywords"> \
          <span class="input-group-btn"> \
            <input type="submit" value="Find produkt" \
              class="btn btn-primary btn-sm" \
              on-click="search()"> \
          </span> \
        </div> \
    </section> \
    <section class="search-results"> \
      <ol class="list-group"> \
          <li class="list-group-item clearfix"> \
            <h3 class="pull-right"> \
              <small>Fra </small> Example date \
            </h3> \
            <h2> Example TITEL </h2> \
            <h4> Example SubTitle</h4> \
            <h5> Example Authors</h5> \
          </li> \
      </ol> \
    </section> \
    '
}).Class({
  constructor: function(){
    this.keywords = null;
  },
  search: function() {
    alert("Søgte efter: " + this.keywords);
  }
});

var ProductAppModule = NgModule({
  imports:      [ BrowserModule, FormsModule ],
  declarations: [ ProductSearchComponent ],
  bootstrap:    [ ProductSearchComponent ]
})
.Class({
  constructor: function() {} 
});

platformBrowserDynamic().bootstrapModule(ProductAppModule);

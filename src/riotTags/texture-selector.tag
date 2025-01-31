texture-selector.panel.view
    //- Возвращает объект выбранной графики или -1, если была выбрана пустая графика.
    //- Пустую графику можно выбрать только при наличии атрибута showempty
    .flexfix.tall
        .flexfix-header
            .toright
                b {vocGlob.sort}   
                button.inline.square(onclick="{switchSort('date')}" class="{selected: sort === 'date' && !searchResults}")
                    i.icon-clock
                button.inline.square(onclick="{switchSort('name')}" class="{selected: sort === 'name' && !searchResults}")
                    i.icon-sort-alphabetically
                .aSearchWrap
                    input.inline(type="text" onkeyup="{fuseSearch}")
            .clear
        .flexfix-body
            ul.cards
                li(if="{opts.showempty}" onclick="{onselected(-1)}")
                    span {window.languageJSON.common.none}
                    img(src="/data/img/notexture.png")
                li(
                    each="{texture in (searchResults? searchResults : textures)}"
                    onclick="{onselected(texture)}"
                    no-reorder
                )
                    span {texture.name}
                    img(src="file://{sessionStorage.projdir + '/img/' + texture.origname + '_prev.png'}")
        .flexfix-footer(if="{oncancelled}")
            button(onclick="{oncancelled}") {window.languageJSON.common.cancel}
    script.
        this.onselected = this.opts.onselected;
        this.oncancelled = this.opts.oncancelled;
        this.namespace = 'common';
        this.mixin(window.riotVoc);
        this.sort = 'name';
        this.sortReverse = false;
        this.searchResults = false;

        this.updateList = () => {
            this.textures = [...window.currentProject.textures];
            if (this.sort === 'name') {
                this.textures.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
            } else {
                this.textures.sort((a, b) => {
                    return b.lastmod - a.lastmod;
                });
            }
            if (this.sortReverse) {
                this.textures.reverse();
            }
        };
        this.switchSort = sort => e => {
            if (this.sort === sort) {
                this.sortReverse = !this.sortReverse;
            } else {
                this.sort = sort;
                this.sortReverse = false;
            }
            this.updateList();
        };
        const fuseOptions = {
            shouldSort: true,
            tokenize: true,
            threshold: 0.5,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ['name']
        };
        const Fuse = require('fuse.js');
        this.fuseSearch = e => {
            if (e.target.value.trim()) {
                var fuse = new Fuse(this.textures, fuseOptions);
                this.searchResults = fuse.search(e.target.value.trim());
            } else {
                this.searchResults = null;
            }
        };
        this.updateList();
        

class EdebiyatDönemi {
    isim: string;
    constructor(isim: string){
        this.isim = isim;
    }
}
 
class Eser {
    isim: string;
    tür: string;
    ünvanlar: Array<string>;
    dönem: EdebiyatDönemi;

    önem_puanı: number;

    constructor(isim:string, tür:string, ünvanlar:Array<string>, dönem: EdebiyatDönemi, önem_puanı: number) {
        this.isim = isim;
        this.tür = tür;
        this.ünvanlar.push(...ünvanlar);
        this.dönem = dönem; 
        this.önem_puanı = önem_puanı;
    }
}

class Yazar {
    isim: string;
    lakapları: Array<string>; 
    eserler: Array<Eser>;

    constructor(isim) {
        this.isim = isim;
    }
    eser_ekle(eser){
        this.eserler.push(eser);
    }
    eser_ekle_ex(isim:string, tür:string, ünvanlar:Array<string>, dönem: EdebiyatDönemi, önem_puanı: number) {
        let eser = new Eser(isim, tür, ünvanlar, dönem, önem_puanı)
        this.eserler.push(eser);
    }
}

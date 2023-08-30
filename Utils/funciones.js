exports.estandarizarFecha = (date, specialFormat, parseHour) => {
    const fecha = new Date(date || new Date().getTime());
    
    if(isNaN(fecha.getTime())) return date;
    
    const norm = n => n < 10 ? "0" + n : n;
    const format = {
      D: fecha.getDate(),
      DD: norm(fecha.getDate()),
      M: fecha.getMonth() + 1,
      MM: norm(fecha.getMonth() + 1),
      YY: fecha.getFullYear().toString().slice(-2),
      YYYY: fecha.getFullYear(),
      H: fecha.getHours(),
      HH: norm(fecha.getHours()),
      m: fecha.getMinutes(),
      mm: norm(fecha.getMinutes()),
      s: fecha.getSeconds(),
      ss: norm(fecha.getSeconds()),
    }
  
    let res = format.DD + "/" + format.MM + "/" + format.YYYY;
    let originalHour = parseInt(format.H);
    if(parseHour) {
      let h = originalHour
      h = h ? h : 12 
      const hourParser = h > 12 ? h - 12 : h
      format.HH = norm(hourParser);
      format.H = hourParser;
    }
  
    if(specialFormat) {
      res = "";
      const str = specialFormat.match(/(\w+)/g);
      const sign = specialFormat.match(/([^\w+])/g);
  
      str.forEach((v,i) => {
        res += format[v];
        if(sign && sign[i]) {
          res += sign[i];
        }
      });
  
      if(parseHour) {
        res += originalHour > 12 ? "p.m" : "a.m";
      }
      
    }
  
    return res;
}


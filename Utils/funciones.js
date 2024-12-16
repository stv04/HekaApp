
/* El código define una función llamada `estandarizarFecha` que toma tres parámetros: `date`,
`specialFormat` y `parseHour`. y devuelve un string con el formato de fecha que se necesita */
exports.estandarizarFecha = (date, specialFormat, parseHour) => {
    // Toma la fecha ingresada o genera una nueva en base al momento que se utiliza la función
    const fecha = new Date(date || new Date().getTime());
    
    // Si el formato de fecha no es el correcto, retorna la misma información que fue recibida
    if(isNaN(fecha.getTime())) return date;
    
    /**
     * Toma un número `n` y devuelve una representación de cadena de `n` con un cero
     * a la izquierda si `n` es menor que 10.
     */
    const norm = n => n < 10 ? "0" + n : n;

    // formatos estandarizados según el string recibido
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
  
    // Se inicializa con el formato por defecto: DD/MM/YYYY
    let res = format.DD + "/" + format.MM + "/" + format.YYYY;
    let originalHour = parseInt(format.H);

    // Encargada de convertir de horario militar al natural si "parseHour" está en true
    if(parseHour) {
      let h = originalHour
      h = h ? h : 12 
      const hourParser = h > 12 ? h - 12 : h
      format.HH = norm(hourParser);
      format.H = hourParser;
    }
  
    // si viene un formato en concreto, se utiliza esa estructura, haciendo match sobre strings literals
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
  
      // si es true se utiliza el formato de a.m/p.m
      if(parseHour) {
        res += originalHour > 12 ? "p.m" : "a.m";
      }
      
    }
  
    // Devuelve un string con la hora formateada
    return res;
}

exports.normalizarValoresNumericos = (valores) => {
  const ks = Object.keys(valores);
  const expInt = /^-?\d+$/;
  const expDbl = /^-?\d+(\.\d+)?$/;

  ks.forEach(k => {
      if(expInt.test(valores[k])) valores[k] = parseInt(valores[k]);
      if(expDbl.test(valores[k])) valores[k] = parseFloat(valores[k]);
  });

  return valores
}

exports.currencyFormatter = (value) => {
  const locale = new Intl.Locale("es-CO");
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  return formatter.format(value);
}
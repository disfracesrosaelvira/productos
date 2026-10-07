const formatDate =  (dateString, isFechaCreacion = false) => {
  
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime()))return "";

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    let hh: any = date.getHours();
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    let formattedDate = `${yyyy}-${mm}-${dd}`;
  
    if (isFechaCreacion) {
      const meridian = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      hh = String(hh).padStart(2, '0');  // Asegurar que las horas tengan dos dígitos
      formattedDate += ` ${hh}:${min}:${ss} ${meridian}`;
    } 
    return formattedDate;
  };
  export default formatDate;
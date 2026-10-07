import { addHours, endOfDay, parseISO } from 'date-fns';

const filterDateRange =  (filterStartDate: string, filterEndDate: string) => {
  // console.log('filterStartDate', filterStartDate);
  // console.log('filterEndDate ', filterEndDate);
  const startOfMonths = parseISO(filterStartDate); // a las ceros horas
  // const endOfMonths = endOfDay(parseISO(filterEndDate)); // las ultimas horas y milesegundos  
  const endOfMonths = parseISO(filterEndDate);

  const adjusted_start_date = addHours(startOfMonths, 5); // suma 5 horas
  const adjusted_end_date = addHours(endOfMonths, 5);
  return { adjusted_start_date, adjusted_end_date }
};

  export default filterDateRange;
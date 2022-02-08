import React, { useEffect, useState } from 'react';
import countries from 'i18n-iso-countries';
import { useApiContext } from './apiContext';
import ForecastSlider from './forecast/ForecastSlider';
import ForecastCard from './ForecastCard';
import ForecastDetail from './ForecastDetail';
import helperModule from '../scripts/engine';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

/*
 create component wrap forecast card and forecast detail as swipable component
 use framer-motion and react swipable
 components accepts array of objects containing current forecast and daily forecast destructured
*/

function Forecast({ location, updateHeroHead }) {
  const [forecast, setForecast] = useState(() => null);
  const [fetchError, setFetchError] = useState(() => null);
  const [isLoading, setIsLoading] = useState(() => true);
  const [isMetric, setIsMetric] = useState(() => true);
  const { WEATHER } = useApiContext();

  const {
    // toTitleCase,
    kelvinToCelsius,
    kelvinToFarhenheit,
    coordinatesUrl,
    forecastUrl,
    msToKmh,
    msToMph,
  } = helperModule;

  useEffect(() => {
    const getForecast = async () => {
      const coordsUrl = coordinatesUrl(WEATHER, location);
      try {
        const response = await fetch(coordsUrl, { method: 'GET' });
        if (!response.ok) {
          updateHeroHead.fail();
          throw Error('failed to fetch coordinates');
        }
        const tempCoord = await response.json();
        const { coord } = tempCoord;
        const response2 = await fetch(forecastUrl(WEATHER, coord), { method: 'GET' });
        if (!response2.ok) throw Error('failed to fetch forecast');
        const weatherData = await response2.json();
        weatherData.country = countries.getName(tempCoord.sys.country, 'en', { select: 'official' });
        weatherData.city = tempCoord.name;
        updateHeroHead.success(weatherData);
        setForecast(() => weatherData);
        setFetchError(() => null);
      } catch (err) {
        setFetchError(() => err.message);
      } finally {
        setIsLoading(() => false);
      }
    };

    getForecast();
  }, [location]);

  const toggleMetricClick = () => {
    setIsMetric((prevState) => !prevState);
  };

  const toggleMetricEnter = (e) => {
    if (e.key === 'Enter') {
      setIsMetric((prevState) => !prevState);
    }
  };

  if (isLoading) {
    return (
      <ForecastCard
        image="loading"
        timestamp="loading"
        weather="loading..."
        temp="loading..."
        toggleMetricClick={toggleMetricClick}
        toggleMetricEnter={toggleMetricEnter}
      />
    );
  }
  return (
    <>
      <div className="is-flex is-flex-direction-row">
        <ForecastSlider
          forecastObj={forecast}
          toggleMetricClick={toggleMetricClick}
          toggleMetricEnter={toggleMetricEnter}
        />
      </div>
      {!fetchError
      && (
        <div className="is-flex-tablet is-grid-mobile mt-3">
          <ForecastDetail
            icon="feels_like"
            label="Feels Like"
            data={
              isMetric ? kelvinToCelsius(forecast.current.feels_like) : kelvinToFarhenheit(forecast.current.feels_like)
            }
          />
          <ForecastDetail
            icon="wind_speed"
            label="Wind Speed"
            data={isMetric ? msToKmh(forecast.current.wind_speed) : msToMph(forecast.current.wind_speed)}
          />
          <ForecastDetail
            icon="humidity"
            label="Humidity"
            data={`${forecast.current.humidity} %`}
          />
          <ForecastDetail
            icon="dew_point"
            label="Dew Point"
            data={
              isMetric ? kelvinToCelsius(forecast.current.dew_point) : kelvinToFarhenheit(forecast.current.dew_point)
            }
          />
          <ForecastDetail
            icon="pop"
            label="PoP"
            data={`${forecast.daily[0].pop * 100}%`} // forecast.daily[0].rain (precipitation volume in mm)
          />
        </div>
      )}
    </>
  );
}

export default Forecast;

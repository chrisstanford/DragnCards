import React, { createContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useDataApi from '../hooks/useDataApi';

export const PluginContext = createContext();

export const PluginProvider = ({ children }) => {
  const pluginId = useSelector(state => state?.gameUi?.game?.pluginId);
  const { data, isLoading, isError, doFetchUrl, doFetchHash, setData } = useDataApi(
    '/be/api/plugins/' + pluginId,
    null
  );

  useEffect(() => {
    console.log('plugininfo 1', pluginId);
    doFetchUrl('/be/api/plugins/' + pluginId);
  }, [pluginId]);

  console.log('plugininfo 2', pluginId, data);

  return (
    <PluginContext.Provider value={{ plugin: data, isLoading }}>
      {children}
    </PluginContext.Provider>
  );
};
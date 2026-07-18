FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY MyHeath.Api/MyHeath.Api.csproj MyHeath.Api/
RUN dotnet restore MyHeath.Api/MyHeath.Api.csproj
COPY MyHeath.Api/ MyHeath.Api/
RUN dotnet publish MyHeath.Api/MyHeath.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:5080
ENV PORT=5080
EXPOSE 5080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MyHeath.Api.dll"]

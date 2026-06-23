using System;
using System.Diagnostics;
using System.ServiceProcess;
using System.IO;

public class FluxoraService : ServiceBase
{
    private static readonly string LogFile = @"C:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\service.log";

    public FluxoraService()
    {
        this.ServiceName = "FluxoraPlatformService";
    }

    private void Log(string message)
    {
        try
        {
            string formattedMessage = string.Format("{0:yyyy-MM-dd HH:mm:ss} - {1}{2}", DateTime.Now, message, Environment.NewLine);
            File.AppendAllText(LogFile, formattedMessage);
        }
        catch { }
    }

    protected override void OnStart(string[] args)
    {
        Log("Service starting...");
        RunDockerCommand("up -d");
        Log("Service started successfully.");
    }

    protected override void OnStop()
    {
        Log("Service stopping...");
        RunDockerCommand("down");
        Log("Service stopped successfully.");
    }

    private void RunDockerCommand(string command)
    {
        try
        {
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = "cmd.exe";
            info.Arguments = string.Format("/c docker compose -f \"c:\\Users\\rajaj\\Projects\\Fluxora_SocialMediaBlast\\docker-compose.yaml\" {0}", command);
            info.WorkingDirectory = @"c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast";
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;

            using (Process p = Process.Start(info))
            {
                string output = p.StandardOutput.ReadToEnd();
                string error = p.StandardError.ReadToEnd();
                p.WaitForExit();

                if (!string.IsNullOrEmpty(output)) Log(string.Format("Output: {0}", output.Trim()));
                if (!string.IsNullOrEmpty(error)) Log(string.Format("Error/Warn: {0}", error.Trim()));
            }
        }
        catch (Exception ex)
        {
            Log(string.Format("Failed to execute docker compose {0}: {1}", command, ex.Message));
        }
    }

    public static void Main()
    {
        ServiceBase.Run(new FluxoraService());
    }
}

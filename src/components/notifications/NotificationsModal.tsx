@@ .. @@
       case 'tournament_join_now':
         return <Video className="h-5 w-5 text-red-500" aria-hidden="true" />;
       case 'new_message':
         return <MessageSquare className="h-5 w-5 text-primary-500" aria-hidden="true" />;
+      case 'registration_cancelled':
+        return <XCircle className="h-5 w-5 text-error-400" aria-hidden="true" />;
       default:
         return <Info className="h-5 w-5 text-gray-400" aria-hidden="true" />;